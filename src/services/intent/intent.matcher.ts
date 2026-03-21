import natural from "natural";
import { BestIntent, IntentDefinition } from "../../types/intent.types3";
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

  private scoreTokens(
    usedTokenIndices:Set<number>,
    phraseTokens: string[],
    stemmedTokens: string[]
  ): {
    matchedTokens: string[],
    phraseScore: number,
    usedIndices: Set<number>,
    isExactMatch: boolean
  } {
    try {
      let currScore = 0;
      const matchedTokens: string[] = [];

      for (const phrase of phraseTokens) {
        const phraseTokenized = this.tokenize(phrase).stemmedTokens;

        if (matchedTokens.includes(phrase)) continue;

        let intersectionTokens = 0;
        const newlyMatchedIndices: number[] = [];

        for (let i = 0; i < stemmedTokens.length; i++) {
          if (usedTokenIndices.has(i)) {
            continue;
          }

          const token = stemmedTokens[i];

          if (phraseTokenized.includes(token)) {
            intersectionTokens++;
            newlyMatchedIndices.push(i);
          }
        }

        if (intersectionTokens === 0 || phraseTokenized.length === 0) continue;
        newlyMatchedIndices.forEach(idx => usedTokenIndices.add(idx));

        const matchRatio = intersectionTokens / phraseTokenized.length;

        if (matchRatio === 1) {
          return {
            matchedTokens: [phrase],
            phraseScore: this.SCORES.EXACT_PHRASE,
            usedIndices: usedTokenIndices,
            isExactMatch: true
          };
        }

        if (matchRatio > 0) {
          const partialScore =
            this.SCORES.EXACT_PHRASE *
            matchRatio *
            this.SCORES.PARTIAL_PHRASE_MULTIPLIER;

          currScore += partialScore;
          matchedTokens.push(phrase);
        }
      }


      return {
        matchedTokens,
        phraseScore: currScore,
        usedIndices: usedTokenIndices,
        isExactMatch: false
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

      let matchedOrganisationTokens: string[] = [];
      let matchedPhraseTokens: string[] = [];

      console.log(`\n--- 🛡️ Evaluating: ${intent.name} (${intent.id}) ---`);

      // Organisation Token Matching
      if (intent.organisation_tokens) {

        const { matchedTokens, phraseScore, usedIndices, isExactMatch } =
          this.scoreTokens(usedTokenIndices,intent.organisation_tokens, stemmedTokens);

        score += phraseScore;
        usedIndices.forEach(index => usedTokenIndices.add(index));
        matchedPhraseTokens = matchedTokens;

        if (isExactMatch) {
          return {
            id: intent.id,
            name: intent.name,
            entity: intent.entity || "UNKNOWN",
            description:intent.description,
            score,
            organisation_tokens: matchedOrganisationTokens,
            phrase_tokens: matchedPhraseTokens
          }
        }
      }

      // Phrase Matching
      if (intent.phrase_tokens) {

        const { matchedTokens, phraseScore, usedIndices, isExactMatch } =
          this.scoreTokens(usedTokenIndices,intent.phrase_tokens, stemmedTokens);

        score += phraseScore;
        usedIndices.forEach(index => usedTokenIndices.add(index));
        matchedPhraseTokens = matchedTokens;

        if (isExactMatch) {
          return {
            id: intent.id,
            name: intent.name,
            entity: intent.entity || "UNKNOWN",
            description:intent.description,
            score,
            organisation_tokens: matchedOrganisationTokens,
            phrase_tokens: matchedPhraseTokens
          }
        }
      }

      if (score > bestIntent.score) {
        console.log(`NEW LEADER: ${intent.name}`);

        bestIntent = {
          id: intent.id,
          name: intent.name,
          description: intent.description,
          entity:intent.entity || "UNKNOWN",
          score,
          organisation_tokens: matchedOrganisationTokens,
          phrase_tokens: matchedPhraseTokens
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
      name: "",
      description: "",
      entity:"UNKNOWN",
      score:0,
      organisation_tokens: [],
      phrase_tokens: []
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
