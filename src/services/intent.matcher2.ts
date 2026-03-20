import natural from "natural";
import { BestIntent, IntentDefinition } from "../types/intent.types2";
const stemmer = natural.PorterStemmer.stem;

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
    private readonly intents: Array<IntentDefinition>,
    private readonly stopWords:Set<string>
  ) {}

  private scorePhrases(
    phraseTokens: string[],
    stemmedTokens: string[]
  ): {
    matchedPhraseTokens: string[],
    phraseScore: number,
    usedPhraseTokenIndices: Set<number>,
    isExactMatch:boolean
  } {
    try {

      console.log("\n🔍 [PHRASE SCORING START]");
      console.log(`   User Tokens: [${stemmedTokens.join(", ")}]`);

      let currScore = 0;
      const matchedPhraseTokens: string[] = [];
      let usedTokenIndices = new Set<number>();

      for (const phrase of phraseTokens) {
        const phraseTokenized = this.tokenize(phrase).stemmedTokens;

        let intersectionTokens = 0;
        const matchedIndexes: number[] = [];

        stemmedTokens.forEach((token, index) => {
          if (phraseTokenized.includes(token)) {
            intersectionTokens++;
            usedTokenIndices.add(index);
            matchedIndexes.push(index);
          }
        });

        const matchRatio = intersectionTokens / phraseTokenized.length;

        if (stemmedTokens.length === 1 && matchRatio === 1) {
          return {
            matchedPhraseTokens: phraseTokenized,
            phraseScore: this.SCORES.EXACT_PHRASE,
            usedPhraseTokenIndices: usedTokenIndices,
            isExactMatch:true
          };

        }

        if (matchRatio === 1 && phraseTokenized.length > 1) {

          return {
            matchedPhraseTokens: phraseTokenized,
            phraseScore: this.SCORES.EXACT_PHRASE,
            usedPhraseTokenIndices: usedTokenIndices,
            isExactMatch:true
          };
        }

        if (matchRatio === 1 && stemmedTokens.length > 1 ) {
          currScore = this.SCORES.EXACT_PHRASE
        }

        // 🔸 PARTIAL MATCH
        if (matchRatio > 0 && phraseTokenized.length > 2) {

          const partialScore =
            this.SCORES.EXACT_PHRASE *
            matchRatio *
            this.SCORES.PARTIAL_PHRASE_MULTIPLIER;

          currScore += partialScore;
          matchedPhraseTokens.push(phrase);
        }

      }

      console.log("\n📊 [PHRASE SCORING COMPLETE]");
      console.log(`   Total Phrase Score: ${currScore.toFixed(2)}`);
      console.log(`   Matched Phrases: [${matchedPhraseTokens.join(" | ")}]`);
      console.log(`   Used Indices: [${[...usedTokenIndices].join(", ")}]`);

      return {
        matchedPhraseTokens,
        phraseScore: currScore,
        usedPhraseTokenIndices: usedTokenIndices,
        isExactMatch:false
      };

    } catch (error) {
      throw error;
    }
  }

  private scoreActionsObjectTokens(
    usedTokenIndices: Set<number>,
    stemmedTokens: string[],
    actionTokens: string[],
    objectTokens: string[],
  ): {
    matchedActionTokens: string[],
    matchedObjectTokens: string[],
    usedIndices: Set<number>,
    actionObjectScore: number
  } {
    try {

      const matchedActionTokens: string[] = [];
      const matchedObjectTokens: string[] = [];
      let actionObjectScore = 0;


      for (const aToken of actionTokens) {

        const aStem = this.tokenizeSingleWord(aToken).stemmed;

        let found = false;

        for (let i = 0; i < stemmedTokens.length; i++) {

          if (usedTokenIndices.has(i)) continue;

          const userToken = stemmedTokens[i];

          if (userToken === aStem) {
            matchedActionTokens.push(aToken);
            usedTokenIndices.add(i);
            found = true;
            break;
          }
        }

      }

      for (const oToken of objectTokens) {

        const oStem = this.tokenizeSingleWord(oToken).stemmed;

        let found = false;

        for (let i = 0; i < stemmedTokens.length; i++) {

          if (usedTokenIndices.has(i)) continue;

          const userToken = stemmedTokens[i];

          if (userToken === oStem) {
            matchedObjectTokens.push(oToken);
            usedTokenIndices.add(i);
            found = true;

            break;
          }
        }

      }

      if (matchedActionTokens.length > 0 && matchedObjectTokens.length > 0) {

        const actionScore = matchedActionTokens.length * this.SCORES.ACTION_TOKEN;
        const objectScore = matchedObjectTokens.length * this.SCORES.OBJECT_TOKEN;

        actionObjectScore =
          actionScore +
          objectScore +
          this.SCORES.SYNERGY_BONUS;

      } else {

        actionObjectScore = 0;
      }


      return {
        matchedActionTokens,
        matchedObjectTokens,
        usedIndices: usedTokenIndices,
        actionObjectScore
      };

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

      let matchedPhrases: string[] = [];
      let matchedActions: string[] = [];
      let matchedObjects: string[] = [];

      console.log(`\n--- 🛡️ Evaluating: ${intent.name} (${intent.id}) ---`);

      // Phrase Matching
      if (intent.phrase_tokens) {

        const { matchedPhraseTokens, phraseScore, usedPhraseTokenIndices, isExactMatch } =
          this.scorePhrases(intent.phrase_tokens, stemmedTokens);
        score += phraseScore;
        usedPhraseTokenIndices.forEach(index => usedTokenIndices.add(index));
        matchedPhrases = matchedPhraseTokens;

        if (isExactMatch) {
          return {
              id: intent.id,
              name: intent.name,
              score,
              phraseTokens: matchedPhrases,
              actionTokens: matchedActions,
              objectTokens: matchedObjects,
          }
        }
      }

      if (intent.action_tokens && intent.object_tokens) {

        const { matchedActionTokens, matchedObjectTokens, usedIndices, actionObjectScore } =
          this.scoreActionsObjectTokens(usedTokenIndices, stemmedTokens, intent.action_tokens, intent.object_tokens);

        score += actionObjectScore;
        usedIndices.forEach(index => usedTokenIndices.add(index));
        matchedActions = matchedActionTokens;
        matchedObjects = matchedObjectTokens;
      }


      if (score > bestIntent.score) {
        console.log(`NEW LEADER: ${intent.name}`);

        bestIntent = {
          id: intent.id,
          name: intent.name,
          score,
          phraseTokens: matchedPhrases,
          actionTokens: matchedActions,
          objectTokens: matchedObjects,
        };
      }

    }

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
