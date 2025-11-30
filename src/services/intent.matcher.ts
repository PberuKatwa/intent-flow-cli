import { tokenize } from "./intent.tokenizer";
import { IntentDefinition, IntentType } from "../types/intent.types";
// A simple levenshtein function (or use a library like 'fast-levenshtein')
import { getLevenshteinDistance } from "../utils/levenshteinDistance"; 

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
  
  let bestIntent = { 
    id: "UNKNOWN", 
    label: "UNKNOWN", 
    score: 0, 
    matchedPhrase: null as string | null 
  };

  for (const intent of intents) {
    let score = 0;
    let matchedPhrase = null;
    
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
        return stemmedTokens.includes(token)
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
      }

    }

    // --- 2. Strong Token Scoring (with Fuzzy Fallback) ---
    if (!matchedPhrase) {
      const intentStrongTokens = intent.strongTokens?.map(t => tokenize(t).stemmedTokens[0]) || [];
      
      for (const iToken of intentStrongTokens) {
        let found = false;

        // Exact Match
        stemmedTokens.forEach((uToken, idx) => {
          if (usedTokenIndices.has(idx)) return;
          if (uToken === iToken) {
            score += SCORES.STRONG_TOKEN;
            usedTokenIndices.add(idx);
            found = true;
          }
        });

        // Fuzzy Match (only if exact not found)
        if (!found) {
           stemmedTokens.forEach((uToken, idx) => {
            if (usedTokenIndices.has(idx)) return;
            // Allow 1 typo for words > 3 chars
            if (uToken.length > 3 && getLevenshteinDistance(uToken, iToken) <= 1) {
              score += SCORES.FUZZY_MATCH;
              usedTokenIndices.add(idx);
            }
          });
        }
      }
    }

    // --- 3. Weak Token Scoring ---
    const intentWeakTokens = intent.weakTokens?.map(t => tokenize(t).stemmedTokens[0]) || [];
    for (const wToken of intentWeakTokens) {
        stemmedTokens.forEach((uToken, idx) => {
          if (usedTokenIndices.has(idx)) return; // Don't score if used by strong/phrase
          if (uToken === wToken) {
            score += SCORES.WEAK_TOKEN;
            usedTokenIndices.add(idx);
          }
        });
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