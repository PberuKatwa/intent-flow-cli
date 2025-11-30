import { tokenize, tokenizeSingleWord } from "./intent.tokenizer";
import { IntentDefinition, IntentType } from "../types/intent.types";
const natural = require('natural'); 
const getLevenshteinDistance = natural.LevenshteinDistance;

const SCORES = {
  EXACT_PHRASE: 10,
  STRONG_TOKEN: 3,
  WEAK_TOKEN: 1,
  FUZZY_MATCH: 1.5,
  MIN_THRESHOLD: 4,
  PARTIAL_PHRASE_MULTIPLIER: 0.5
};

export function detectIntent(intents: Array<IntentDefinition>, message: string) {
  const { stemmedTokens } = tokenize(message);

  const matchedStrongTokens:Array<string> = []
  const matchedFuzzyTokens:Array<string>  = []
  const matchedWeakTokens:Array<string>  = []
  
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

      let intersectionTokens = 0;

      stemmedTokens.forEach(
        function( token, index ){

          if(phraseTokens.includes(token)){
            intersectionTokens ++
            usedTokenIndices.add(index)
          }

        }
      )

      const matchRatio = ( intersectionTokens / phraseTokens.length )

      if( matchRatio === 1 ){

        return {
          id: intent.id,
          label: intent.label,
          score: SCORES.EXACT_PHRASE,
          phrase:phrase
        }

      } else if( matchRatio < 1 ){
        score += ( SCORES.EXACT_PHRASE * matchRatio * SCORES.PARTIAL_PHRASE_MULTIPLIER ) 
      }

    }

    // --- 2. Strong Token Scoring (with Fuzzy Fallback) ---
    if(intent.strongTokens){
      let matchFound = false

      for(const sToken of intent.strongTokens){

        let sTokenized = tokenizeSingleWord(sToken).stemmed

        for( let i = 0 ; i < stemmedTokens.length; i++ ){

          const userToken = stemmedTokens[i]

          if( usedTokenIndices.has(i) ) continue

          if( userToken == sTokenized ){
            score += SCORES.STRONG_TOKEN
            usedTokenIndices.has(i)
            matchedStrongTokens.push(userToken)
          } else{

            const distance = getLevenshteinDistance( sTokenized, userToken )

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
          if( wTokenized === token ){

            score += SCORES.STRONG_TOKEN
            matchedWeakTokens.push(token)

          } 
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
    return { ...bestIntent, id: IntentType.UNKNOWN, label: "UNKNOWN",matchedFuzzyTokens, matchedStrongTokens, matchedWeakTokens };
  }

  return bestIntent;
}