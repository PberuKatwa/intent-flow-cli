import natural from "natural";
import { BestIntent, ReadOnlyIntentDefinition } from "../types/intent.types2";
const getLevenshteinDistance = natural.LevenshteinDistance;
const stemmer = natural.PorterStemmer.stem;

// Token for DI (NestJS style)
export const INTENT_DEFINITIONS = "INTENT_DEFINITIONS";

export class IntentDetectorService {

  private readonly SCORES = {
    EXACT_PHRASE: 10,
    ACTION_TOKEN: 4,
    OBJECT_TOKEN: 2,
    FUZZY_MATCH: 1.5,
    MIN_THRESHOLD: 4,
    PARTIAL_PHRASE_MULTIPLIER: 0.5,
    SYNERGY_BONUS: 2
  };

  constructor(
    private readonly intents: Array<ReadOnlyIntentDefinition>,
    private readonly stopWords:Set<string>
  ) {}

  private scorePhrases(
    phraseTokens: string[],
    stemmedTokens: string[]
  ):
    {
      matchedPhraseTokens: string[],
      phraseScore: number,
      usedPhraseTokenIndices: Set<number>
    }
    {
    try {

      let currScore = 0;
      const matchedPhraseTokens = [];
      let usedTokenIndices = new Set<number>();

      for (const phrase of phraseTokens) {

        const phraseTokens = this.tokenize(phrase).stemmedTokens;
        let intersectionTokens = 0;

        stemmedTokens.forEach((token, index) => {
          if (phraseTokens.includes(token)) {
            intersectionTokens++;
            usedTokenIndices.add(index);
          }
        });

        const matchRatio = intersectionTokens / phraseTokens.length;

        if (matchRatio === 1 && phraseTokens.length > 1) {
          console.log(`   ✅ EXACT PHRASE MATCH: "${phrase}"`);
          return {
            matchedPhraseTokens: phraseTokens,
            phraseScore: this.SCORES.EXACT_PHRASE,
            usedPhraseTokenIndices:usedTokenIndices
          };
        }

        // Partial phrase
        if (matchRatio > 0 && matchRatio < 1 && phraseTokens.length > 2) {
          const partialScore = this.SCORES.EXACT_PHRASE * matchRatio * this.SCORES.PARTIAL_PHRASE_MULTIPLIER;

          currScore += partialScore;
          matchedPhraseTokens.push(phrase);

          console.log(`Partial Phrase: "${phrase}" (+${partialScore.toFixed(2)})`);
        }

      }

      return {
        matchedPhraseTokens,
        phraseScore:currScore,
        usedPhraseTokenIndices:usedTokenIndices
      }

    } catch (error) {
      throw error;
    }
  }

  private scoreActionsObjectTokens(
    usedTokenIndices: Set<number>,
    stemmedTokens:string[],
    actionTokens: string[],
    objectTokens: string[],
  ): {
      matchedActionTokens: string[],
      matchedObjectTokens: string[],
      usedIndices: Set<number>,
      actionObjectScore:number
  } {
    try {

      const matchedActionTokens = [];
      const matchedObjectTokens = [];
      let actionObjectScore = 0;

      // Actions Token.
      for (const aToken of actionTokens || []) {

        const aStem = this.tokenizeSingleWord(aToken).stemmed;

        for (let i = 0; i < stemmedTokens.length; i++) {

          if (usedTokenIndices.has(i)) continue;
          const userToken = stemmedTokens[i];

          if (userToken === aStem) {
            matchedActionTokens.push(aToken);
            usedTokenIndices.add(i);

            console.log(`Action Match: "${aToken}"`);
          }

        }
      }

      // Object Scoring.
      for (const oToken of objectTokens || []) {

        const oStem = this.tokenizeSingleWord(oToken).stemmed;

        for (let i = 0; i < stemmedTokens.length; i++) {

          if (usedTokenIndices.has(i)) continue;
          const userToken = stemmedTokens[i];

          if (userToken === oStem) {

            matchedObjectTokens.push(oToken);
            usedTokenIndices.add(i);

            console.log(`Object Match: "${oToken}"`);
          }

        }
      }

      if (matchedActionTokens.length > 0 && matchedObjectTokens.length > 0) {

        actionObjectScore = matchedActionTokens.length * this.SCORES.ACTION_TOKEN + matchedObjectTokens.length * this.SCORES.OBJECT_TOKEN
          + this.SCORES.SYNERGY_BONUS;

        console.log(`VALID INTENT (Action + Object)`);
      } else {
        actionObjectScore = 0;
        console.log(`Rejected (missing action or object)`);
      }

      return {
        matchedActionTokens,
        matchedObjectTokens,
        usedIndices: usedTokenIndices,
        actionObjectScore
      }

    } catch (error) {
      throw error;
    }
  }

  /**
   * Main detection entry point
   */
  public processIntent(message: string): BestIntent {
    const { stemmedTokens, originalTokens } = this.tokenize(message);

    console.log(`\n🔍 [TOKENIZATION]`);
    console.log(`   Original: [${originalTokens.join(", ")}]`);
    console.log(`   Stemmed:  [${stemmedTokens.join(", ")}]`);

    let bestIntent: BestIntent = this.getInitialBestIntent();

    for (const intent of this.intents) {
      let score = 0;
      const usedTokenIndices = new Set<number>();

      const matchedActions: string[] = [];
      const matchedObjects: string[] = [];
      const matchedFuzzy: string[] = [];

      console.log(`\n--- 🛡️ Evaluating: ${intent.name} (${intent.id}) ---`);

      // Phrase Matching
      const { matchedPhraseTokens, phraseScore, usedPhraseTokenIndices } = this.scorePhrases(intent.phrase_tokens, stemmedTokens);
      score += phraseScore;
      usedPhraseTokenIndices.forEach(index => usedTokenIndices.add(index));


      // -------------------------
      // 2. ACTION TOKEN MATCHING
      // -------------------------
      for (const aToken of intent.action_tokens || []) {
        const aStem = this.tokenizeSingleWord(aToken).stemmed;

        for (let i = 0; i < stemmedTokens.length; i++) {
          if (usedTokenIndices.has(i)) continue;

          const userToken = stemmedTokens[i];

          if (userToken === aStem) {
            matchedActions.push(aToken);
            usedTokenIndices.add(i);

            console.log(`   ⚡ Action Match: "${aToken}"`);
          } else {
            const distance = getLevenshteinDistance(aStem, userToken);

            if (distance <= 1) {
              matchedFuzzy.push(aToken);
              usedTokenIndices.add(i);

              console.log(`   ☁️ Fuzzy Action: "${userToken}" ~ "${aToken}"`);
            }
          }
        }
      }

      // -------------------------
      // 3. OBJECT TOKEN MATCHING
      // -------------------------
      for (const oToken of intent.object_tokens || []) {
        const oStem = this.tokenizeSingleWord(oToken).stemmed;

        for (let i = 0; i < stemmedTokens.length; i++) {
          if (usedTokenIndices.has(i)) continue;

          const userToken = stemmedTokens[i];

          if (userToken === oStem) {
            matchedObjects.push(oToken);
            usedTokenIndices.add(i);

            console.log(`   📦 Object Match: "${oToken}"`);
          } else {
            const distance = getLevenshteinDistance(oStem, userToken);

            if (distance <= 1) {
              matchedFuzzy.push(oToken);
              usedTokenIndices.add(i);

              console.log(`   ☁️ Fuzzy Object: "${userToken}" ~ "${oToken}"`);
            }
          }
        }
      }

      // -------------------------
      // 4. STRICT SCORING
      // -------------------------
      if (matchedActions.length > 0 && matchedObjects.length > 0) {
        score =
          matchedActions.length * this.SCORES.ACTION_TOKEN +
          matchedObjects.length * this.SCORES.OBJECT_TOKEN +
          this.SCORES.SYNERGY_BONUS;

        console.log(`   🔥 VALID INTENT (Action + Object)`);
      } else {
        score = 0; // 🚨 HARD FILTER
        console.log(`   ❌ Rejected (missing action or object)`);
      }

      console.log(`   📊 Score: ${score}`);

      // -------------------------
      // 5. UPDATE BEST INTENT
      // -------------------------
      if (score > bestIntent.score) {
        console.log(`   ⭐ NEW LEADER: ${intent.name}`);

        bestIntent = {
          id: intent.id,
          name: intent.name,
          score,
          partialPhrases: matchedPartial,
          actionTokens: matchedActions,
          objectTokens: matchedObjects,
          fuzzyTokens: matchedFuzzy
        };
      }
    }

    // -------------------------
    // 6. FINAL RESULT
    // -------------------------
    const finalResult =
      bestIntent.score < this.SCORES.MIN_THRESHOLD
        ? this.getInitialBestIntent()
        : bestIntent;

    console.log(`\n🏆 [FINAL RESULT]`);
    console.log(
      `   Winner: ${finalResult.name} (Score: ${finalResult.score})`
    );
    console.log(`---------------------------------------------\n`);

    return finalResult;
  }

  private getInitialBestIntent(): BestIntent {
    return {
      id: 0,
      name: "UNKNOWN",
      score: 0,
      phraseTokens: [],
      actionTokens: [],
      objectTokens: [],
      fuzzyTokens: []
    };
  }

  private tokenize(text: string) {
    const cleanText = text.toLocaleLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    // Remove duplicates while keeping order
    const originalTokens: string[] = Array.from(new Set(cleanText));

    const stemmedTokens: string[] = Array.from(
      new Set(
        originalTokens
          .filter(t => !this.stopWords.has(t))
          .map(t => stemmer(t))
      )
    );

    return { originalTokens, stemmedTokens };
  }

  private tokenizeSingleWord(text: string) {
    const cleanTokens = text.toLocaleLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    if (cleanTokens.length === 0) {
      return { original: text, stemmed: '', isStopWord: false };
    }

    const originalWord = cleanTokens[0];
    const isStopWord = this.stopWords.has(originalWord);
    const stemmedWord = !isStopWord ? stemmer(originalWord) : '';

    return { original: originalWord, stemmed: stemmedWord, isStopWord };
  }
}
