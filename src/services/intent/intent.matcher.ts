import natural from "natural";
import { BestIntent, IntentDefinition } from "../../types/intent.types3";
import GeminiChatService from "../gemini.service";
import { buildIntentPrompt } from "../../utils/build.prompt";
import { addOrganisationToken } from "../../utils/json.utils";
const stemmer = natural.PorterStemmer.stem;

export class IntentDetectorService {

  private readonly SCORES = {
    EXACT_PHRASE: 10,
    MIN_THRESHOLD: 4,
    PARTIAL_PHRASE_MULTIPLIER: 0.5,
  };

  constructor(
    private readonly intents: Array<IntentDefinition>,
    private readonly stopWords: Set<string>,
    private readonly geminiService:GeminiChatService
  ) { }

  public async getFinalIntent(userMessage:string):Promise<BestIntent> {
    try {

      let intent:BestIntent = this.processIntent(userMessage);

      if (intent.name === "UNKNOWN") {
        const prompt = buildIntentPrompt(userMessage)
        intent = await this.geminiService.getLlmIntent(prompt);

        addOrganisationToken(intent.id, intent.userMessage);
      };

      return intent;
    } catch (error) {
      throw error
    }
  }

  private scoreTokensInverted(
      usedTokenIndices: Set<number>,
      phraseTokens: string[],
      stemmedTokens: string[]
    ): {
      matchedTokens: string[],
      phraseScore: number,
      usedIndices: Set<number>,
      isExactMatch: boolean
    } {
      try {
        console.log(`\n--- Starting Token Scoring (Inverted Index) ---`);
        console.log(`Input Tokens: [${stemmedTokens.join(', ')}]`);

        // 1. Build Inverted Index
        const messageIndex: Record<string, number[]> = {};
        stemmedTokens.forEach((token, idx) => {
          if (!messageIndex[token]) messageIndex[token] = [];
          messageIndex[token].push(idx);
        });
        console.log(`Inverted Index built for ${Object.keys(messageIndex).length} unique tokens.`);

        let currScore = 0;
        const matchedTokens: string[] = [];

        for (const phrase of phraseTokens) {
          const phraseTokenized = this.tokenize(phrase).stemmedTokens;
          if (phraseTokenized.length === 0 || matchedTokens.includes(phrase)) continue;

          console.log(`\nEvaluating Phrase: "${phrase}"`);
          console.log(`  └─ Tokens: [${phraseTokenized.join(', ')}]`);

          // --- PASS 1: GREEDY EXACT SET MATCH ---
          const potentialIndices: number[] = [];
          let allWordsPresent = true;

          for (const pToken of phraseTokenized) {
            const occurrences = messageIndex[pToken];
            const foundIdx = occurrences?.find(idx => !potentialIndices.includes(idx));

            if (foundIdx !== undefined) {
              potentialIndices.push(foundIdx);
            } else {
              allWordsPresent = false;
              break;
            }
          }

          if (allWordsPresent) {
            console.log(`  ✅ EXACT MATCH FOUND (Ignoring order). Indices: [${potentialIndices}]`);
            potentialIndices.forEach(idx => usedTokenIndices.add(idx));

            return {
              matchedTokens: [phrase],
              phraseScore: this.SCORES.EXACT_PHRASE,
              usedIndices: usedTokenIndices,
              isExactMatch: true
            };
          }

          // --- PASS 2: PARTIAL MATCH (Respecting usedTokenIndices) ---
          const newlyMatchedIndices: number[] = [];
          let intersectionCount = 0;

          for (const pToken of phraseTokenized) {
            const occurrences = messageIndex[pToken];

            // Logic: find index not in usedTokenIndices and not already found in THIS loop
            const availableIdx = occurrences?.find(idx =>
              !usedTokenIndices.has(idx) && !newlyMatchedIndices.includes(idx)
            );

            if (availableIdx !== undefined) {
              intersectionCount++;
              newlyMatchedIndices.push(availableIdx);
            }
          }

          if (intersectionCount > 0) {
            const matchRatio = intersectionCount / phraseTokenized.length;
            const partialScore =
              this.SCORES.EXACT_PHRASE * matchRatio * this.SCORES.PARTIAL_PHRASE_MULTIPLIER;

            console.log(`  ⚠️  PARTIAL MATCH: ${intersectionCount}/${phraseTokenized.length} tokens found.`);
            console.log(`  └─ Score: +${partialScore.toFixed(2)} | Indices Claimed: [${newlyMatchedIndices}]`);

            newlyMatchedIndices.forEach(idx => usedTokenIndices.add(idx));
            currScore += partialScore;
            matchedTokens.push(phrase);
          } else {
            console.log(`  ❌ NO MATCH for this phrase.`);
          }
        }

        console.log(`\n--- Final Result ---`);
        console.log(`Total Score: ${currScore}`);
        console.log(`Matched Phrases: ${matchedTokens.length > 0 ? matchedTokens.join(', ') : 'None'}`);

        return {
          matchedTokens,
          phraseScore: currScore,
          usedIndices: usedTokenIndices,
          isExactMatch: false
        };

      } catch (error) {
        console.error(`Error in scoreTokensInverted:`, error);
        throw error;
      }
  }

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
          this.scoreTokensInverted(usedTokenIndices,intent.organisation_tokens, stemmedTokens);

        console.log("founddddd organisationnn", matchedTokens, phraseScore, usedIndices, isExactMatch)

        if (isExactMatch) {
          return {
            id: intent.id,
            name: intent.name,
            entity: intent.entity || "UNKNOWN",
            description: intent.description,
            userMessage:message,
            score:phraseScore,
            organisation_tokens: matchedTokens,
            phrase_tokens: []
          }
        }

        score += phraseScore;
        usedIndices.forEach(index => usedTokenIndices.add(index));
        matchedOrganisationTokens = matchedTokens;
      }

      // Phrase Matching
      if (intent.phrase_tokens) {

        const { matchedTokens, phraseScore, usedIndices, isExactMatch } =
          this.scoreTokensInverted(usedTokenIndices,intent.phrase_tokens, stemmedTokens);

        console.log("PHRASEEEEEEEEEE", matchedTokens, phraseScore, usedIndices, isExactMatch)

        if (isExactMatch) {
          return {
            id: intent.id,
            name: intent.name,
            userMessage:message,
            entity: intent.entity || "UNKNOWN",
            description:intent.description,
            score:phraseScore,
            organisation_tokens: [],
            phrase_tokens: matchedTokens
          }
        }

        score += phraseScore;
        usedIndices.forEach(index => usedTokenIndices.add(index));
        matchedPhraseTokens = matchedTokens;
      }



      if (score > bestIntent.score) {
        console.log(`NEW LEADER: ${intent.name}`, bestIntent);

        bestIntent = {
          id: intent.id,
          name: intent.name,
          userMessage:message,
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
      name: "UNKNOWN",
      description: "UNKNOWN",
      userMessage:"UNKNOWN",
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
