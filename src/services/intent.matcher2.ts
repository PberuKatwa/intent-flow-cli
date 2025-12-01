import { tokenize, tokenizeSingleWord } from "./intent.tokenizer";
import { IntentDefinition, BestIntent } from "../types/intent.types";
const natural = require("natural");
const getLevenshteinDistance = natural.LevenshteinDistance;

const SCORES = {
  EXACT_PHRASE: 10,
  STRONG_TOKEN: 3,
  WEAK_TOKEN: 1,
  FUZZY_MATCH: 1.5,
  MIN_THRESHOLD: 4,
  PARTIAL_PHRASE_MULTIPLIER: 0.5,
};

export function detectIntent(intents: Array<IntentDefinition>, message: string): BestIntent {
  try {
    console.log("\n===============================================");
    console.log("🔍 DETECT INTENT START");
    console.log("Original message:", message);

    const tokenResult = tokenize(message);
    const stemmedTokens = tokenResult.stemmedTokens;

    console.log("Tokenized user message:", stemmedTokens);
    console.log("===============================================\n");

    const matchedStrongTokens: Array<string> = [];
    const matchedFuzzyTokens: Array<string> = [];
    const matchedWeakTokens: Array<string> = [];

    let bestIntent: BestIntent = {
      id: "UNKNOWN",
      label: "UNKNOWN",
      score: 0,
      matchedPhrase: "UNKNOWN",
      weakTokens: [],
      strongTokens: [],
      fuzzyTokens: [],
    };

    for (const intent of intents) {
      console.log("\n--------------------------------------------------");
      console.log(`🎯 CHECKING INTENT: ${intent.id} (${intent.label})`);
      console.log("--------------------------------------------------");

      let score = 0;
      const usedTokenIndices = new Set<number>();

      // -------------------------------------------------------
      // 1. PHRASE MATCHING
      // -------------------------------------------------------
      console.log("\n▶ PHRASE MATCHING CHECK");

      for (const phrase of intent.phrases) {
        console.log(`  • Testing phrase: "${phrase}"`);

        const phraseTokens = tokenize(phrase).stemmedTokens;
        console.log("    → Phrase tokens:", phraseTokens);

        let intersectionTokens = 0;

        stemmedTokens.forEach((token, index) => {
          if (phraseTokens.includes(token)) {
            intersectionTokens++;
            usedTokenIndices.add(index);
            console.log(`      ✓ Token "${token}" matched phrase`);
          }
        });

        const matchRatio = intersectionTokens / phraseTokens.length;
        console.log(`    → Match ratio: ${matchRatio}`);

        if (matchRatio === 1) {
          console.log("    🎉 EXACT phrase match detected! Returning immediately.");
          return {
            id: intent.id,
            label: intent.label,
            score: SCORES.EXACT_PHRASE,
            matchedPhrase: phrase,
          };
        } else if (matchRatio < 1) {
          const partialScore = SCORES.EXACT_PHRASE * matchRatio * SCORES.PARTIAL_PHRASE_MULTIPLIER;
          console.log(`    → Partial phrase score added: +${partialScore}`);
          score += partialScore;
        }
      }

      // -------------------------------------------------------
      // 2. STRONG TOKEN MATCHING
      // -------------------------------------------------------
      console.log("\n▶ STRONG TOKEN MATCHING");

      if (intent.strongTokens) {
        for (const sToken of intent.strongTokens) {
          const sTokenized = tokenizeSingleWord(sToken).stemmed;
          console.log(`  • Strong token: "${sToken}" → stem: "${sTokenized}"`);

          for (let i = 0; i < stemmedTokens.length; i++) {
            const userToken = stemmedTokens[i];

            if (usedTokenIndices.has(i)) continue;

            if (userToken === sTokenized) {
              console.log(`      ✓ EXACT strong token match: "${userToken}" (+${SCORES.STRONG_TOKEN})`);
              score += SCORES.STRONG_TOKEN;
              usedTokenIndices.add(i);
              matchedStrongTokens.push(userToken);
            } else {
              const distance = getLevenshteinDistance(sTokenized, userToken);

              if (distance <= 1) {
                console.log(`      ~ Fuzzy strong match: "${userToken}" ~ "${sTokenized}" (distance=${distance}) (+${SCORES.FUZZY_MATCH})`);
                score += SCORES.FUZZY_MATCH;
                usedTokenIndices.add(i);
                matchedFuzzyTokens.push(sToken);
              }
            }
          }
        }
      }

      // -------------------------------------------------------
      // 3. WEAK TOKEN MATCHING
      // -------------------------------------------------------
      console.log("\n▶ WEAK TOKEN MATCHING");

      if (intent.weakTokens) {
        for (const wToken of intent.weakTokens) {
          const wTokenized = tokenizeSingleWord(wToken).stemmed;
          console.log(`  • Weak token: "${wToken}" → stem: "${wTokenized}"`);

          for (let i = 0; i < stemmedTokens.length; i++) {
            const userToken = stemmedTokens[i];

            if (usedTokenIndices.has(i)) continue;

            if (userToken === wTokenized) {
              console.log(`      ✓ Weak token match: "${userToken}" (+${SCORES.WEAK_TOKEN})`);
              score += SCORES.WEAK_TOKEN;
              usedTokenIndices.add(i);
              matchedWeakTokens.push(wToken);
            }
          }
        }
      }

      // -------------------------------------------------------
      // 4. UPDATE BEST INTENT
      // -------------------------------------------------------
      console.log(`\n▶ TOTAL score for intent "${intent.id}":`, score);

      if (score > bestIntent.score) {
        console.log(`🔥 NEW BEST INTENT FOUND: "${intent.id}" with score ${score}`);
        bestIntent = {
          id: intent.id,
          label: intent.label,
          score,
          weakTokens: [...matchedWeakTokens],
          strongTokens: [...matchedStrongTokens],
          fuzzyTokens: [...matchedFuzzyTokens],
        };
      } else {
        console.log(`  → Intent "${intent.id}" did NOT beat current best score (${bestIntent.score})`);
      }
    }

    // -------------------------------------------------------
    // FINAL RESULT CHECK
    // -------------------------------------------------------
    console.log("\n===============================================");
    console.log(`🏁 FINAL BEST INTENT: ${bestIntent.id} (score=${bestIntent.score})`);
    console.log("===============================================\n");

    if (bestIntent.score < SCORES.MIN_THRESHOLD) {
      console.log("⚠ Score below minimum threshold. Marking as UNKNOWN.");
      bestIntent.id = "UNKNOWN";
      bestIntent.label = "UNKNOWN";
    }

    return bestIntent;
  } catch (error) {
    console.error("❌ ERROR in detectIntent:", error);
    throw error;
  }
}
