import natural from "natural";
import { tokenize, tokenizeSingleWord } from "./intent.tokenizer";
import { BestIntent, ReadOnlyIntentDefinition } from "../types/intent.types";

const getLevenshteinDistance = natural.LevenshteinDistance;

const SCORES = {
  EXACT_PHRASE: 10,
  ACTION_TOKEN: 4,
  OBJECT_TOKEN: 2,
  FUZZY_MATCH: 1.5,
  MIN_THRESHOLD: 4,
  PARTIAL_PHRASE_MULTIPLIER: 0.5,
  SYNERGY_BONUS: 2
};

export function detectIntent(
  intents: Array<ReadOnlyIntentDefinition>,
  message: string
): BestIntent {
  try {
    const { stemmedTokens } = tokenize(message);

    let bestIntent: BestIntent = {
      id: "UNKNOWN",
      label: "UNKNOWN",
      score: 0,
      matchedPhrase: "UNKNOWN",
      partialPhrases: [],
      actionTokens: [],
      objectTokens: [],
      fuzzyTokens: []
    };

    for (const intent of intents) {
      let score = 0;
      const usedTokenIndices = new Set<number>();

      const matchedActions: string[] = [];
      const matchedObjects: string[] = [];
      const matchedFuzzy: string[] = [];
      const matchedPartial: string[] = [];

      // -------------------------
      // 1. PHRASE MATCHING (UNCHANGED)
      // -------------------------
      for (const phrase of intent.phrases) {
        const phraseTokens = tokenize(phrase).stemmedTokens;
        let intersectionTokens = 0;

        stemmedTokens.forEach((token, index) => {
          if (phraseTokens.includes(token)) {
            intersectionTokens++;
            usedTokenIndices.add(index);
          }
        });

        const matchRatio = intersectionTokens / phraseTokens.length;

        // ✅ Exact phrase → immediate return
        if (matchRatio === 1 && phraseTokens.length > 1) {
          return {
            id: intent.id,
            label: intent.label,
            score: SCORES.EXACT_PHRASE,
            matchedPhrase: phrase
          };
        }

        // 🔸 Partial phrase
        if (matchRatio > 0 && matchRatio < 1 && phraseTokens.length > 2) {
          const partialScore =
            SCORES.EXACT_PHRASE *
            matchRatio *
            SCORES.PARTIAL_PHRASE_MULTIPLIER;

          score += partialScore;
          matchedPartial.push(phrase);
        }
      }

      // -------------------------
      // 2. ACTION TOKEN MATCHING
      // -------------------------
      if (intent.action_tokens) {
        for (const aToken of intent.action_tokens) {
          const aStem = tokenizeSingleWord(aToken).stemmed;

          for (let i = 0; i < stemmedTokens.length; i++) {
            if (usedTokenIndices.has(i)) continue;

            const userToken = stemmedTokens[i];

            if (userToken === aStem) {
              matchedActions.push(aToken);
              usedTokenIndices.add(i);
            } else {
              const distance = getLevenshteinDistance(aStem, userToken);

              if (distance <= 1) {
                matchedFuzzy.push(aToken);
                usedTokenIndices.add(i);
              }
            }
          }
        }
      }

      // -------------------------
      // 3. OBJECT TOKEN MATCHING
      // -------------------------
      if (intent.object_tokens) {
        for (const oToken of intent.object_tokens) {
          const oStem = tokenizeSingleWord(oToken).stemmed;

          for (let i = 0; i < stemmedTokens.length; i++) {
            if (usedTokenIndices.has(i)) continue;

            const userToken = stemmedTokens[i];

            if (userToken === oStem) {
              matchedObjects.push(oToken);
              usedTokenIndices.add(i);
            } else {
              const distance = getLevenshteinDistance(oStem, userToken);

              if (distance <= 1) {
                matchedFuzzy.push(oToken);
                usedTokenIndices.add(i);
              }
            }
          }
        }
      }

      // -------------------------
      // 4. STRICT SCORING (KEY CHANGE)
      // -------------------------
      if (matchedActions.length > 0 && matchedObjects.length > 0) {
        score =
          matchedActions.length * SCORES.ACTION_TOKEN +
          matchedObjects.length * SCORES.OBJECT_TOKEN +
          SCORES.SYNERGY_BONUS;
      } else {
        score = 0; // 🚨 HARD FILTER (prevents false positives)
      }

      // -------------------------
      // 5. UPDATE BEST INTENT
      // -------------------------
      if (score > bestIntent.score) {
        bestIntent = {
          id: intent.id,
          label: intent.label,
          score,
          partialPhrases: matchedPartial,
          actionTokens: matchedActions,
          objectTokens: matchedObjects,
          fuzzyTokens: matchedFuzzy
        };
      }
    }

    // -------------------------
    // 6. FINAL THRESHOLD CHECK
    // -------------------------
    if (bestIntent.score < SCORES.MIN_THRESHOLD) {
      return {
        ...bestIntent,
        id: "UNKNOWN",
        label: "UNKNOWN"
      };
    }

    return bestIntent;
  } catch (error) {
    throw error;
  }
}
