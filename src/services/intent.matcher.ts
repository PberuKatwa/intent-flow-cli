import { tokenize, tokenizeSingleWord } from "./intent.tokenizer";
import { IntentDefinition, IntentType } from "../types/intent.types";
const natural = require('natural'); // Import natural here too
const getLevenshteinDistance = natural.LevenshteinDistance;

const SCORES = {
  EXACT_PHRASE: 10,
  STRONG_TOKEN: 3,
  WEAK_TOKEN: 1,
  FUZZY_MATCH: 1.5, // Score for "almost" matching a token
  MIN_THRESHOLD: 4,
  PARTIAL_PHRASE_MULTIPLIER: 0.5
};

export function detectIntent(intents: Array<IntentDefinition>, message: string) {
  const { stemmedTokens } = tokenize(message);

  const matchedStrongTokens = []
  const matchedFuzzyTokens = []
  const matchedWeakTokens = []
  
  let bestIntent = { 
    id: "UNKNOWN", 
    label: "UNKNOWN", 
    score: 0, 
    matchedPhrase: null as string | null 
  };

  for (const intent of intents) {
    let score = 0;
    let matchedPhrase = null;

    console.log("\n--------------------------------------------------");
    console.log(`INTENT: ${intent.id} (${intent.label})`);
    console.log("--------------------------------------------------");
    
    // Set of indices in user input that have been "used" to prevent double scoring
    const usedTokenIndices = new Set<number>();
    let tokenList = stemmedTokens

    // --- 1. Phrase Matching (Normalized Jaccard) ---
    // We treat phrases as "bags of stemmed words" to handle "order cancel" vs "cancel order"
    for (const phrase of intent.phrases) {

      const phraseTokens = tokenize(phrase).stemmedTokens;

      const intersectionTokens = phraseTokens.filter( function(token){
        return stemmedTokens.includes(token)
      })

      tokenList = phraseTokens.filter( function(token){
        return !stemmedTokens.includes(token)
      })

      const matchRatio = ( intersectionTokens.length / phraseTokens.length )

      if( matchRatio === 1 ){

        return {
          id: intent.id,
          label: intent.label,
          score: SCORES.EXACT_PHRASE,
          phrase:phrase
        }

      } else if( matchRatio < 1 ){
        score += ( SCORES.EXACT_PHRASE * matchRatio * SCORES.PARTIAL_PHRASE_MULTIPLIER ) 

        stemmedTokens.forEach((t, index) => {
          if (phraseTokens.includes(t)) {
            usedTokenIndices.add(index);
            console.log(`Marked token "${t}" at index ${index} as USED`);
          }
        });

      }

      console.log(`STEMMED:${stemmedTokens}, PHRASE:${phraseTokens}, MODIFIEED:${tokenList}, SCORE:${score}`)
    }

    // --- 2. Strong Token Scoring (with Fuzzy Fallback) ---
    if(intent.strongTokens){

      for(const sToken of intent.strongTokens){

        let sTokenized = tokenizeSingleWord(sToken).stemmed

        for( const tok of tokenList ){

          if(sTokenized === tok){

            score += SCORES.STRONG_TOKEN
            matchedStrongTokens.push(tok)  
                      
          }else{

            const distance = getLevenshteinDistance(tok, sTokenized);
            if( distance.length <= 1 ) score += SCORES.FUZZY_MATCH

            matchedFuzzyTokens.push(tok)

          }

        }
      }

      console.log(`Strong `)
    }

    // 3.Weak Token scoring
    if(intent.weakTokens){

      for(const wToken of intent.weakTokens){

        let wTokenized = tokenizeSingleWord(wToken).stemmed

        for(const token of tokenList){
          if( wTokenized === token ) score += SCORES.STRONG_TOKEN
        } 

      }

    }

    // Update Best
    if (score > bestIntent.score) {

      bestIntent = {
        id: intent.id,
        label: intent.label,
        score: score,
        matchedPhrase
      };
      
    }
  }

  if (bestIntent.score < SCORES.MIN_THRESHOLD) {
    return { ...bestIntent, id: IntentType.UNKNOWN, label: "UNKNOWN" };
  }

  return bestIntent;
}