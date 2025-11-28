import { tokenize } from "./intent.tokenizer";
import { IntentDefinition, IntentType } from "../types/intent.types";

const PHRASE_SCORE = 6;
const STRONG_TOKEN_SCORE = 2;
const WEAK_TOKEN_SCORE = 1;
const MULTI_TOKEN_BONUS = 2;
const MIN_ACCEPT_SCORE = 4; // below this → UNKNOWN
const MATCHED_TOKENS = []

export function detectIntent(
  intents: Array<IntentDefinition>,
  message: string
) {
  const text = message.toLowerCase().trim();
  const tokens = tokenize(text);

  // Track scores
  let bestIntent = IntentType.UNKNOWN;
  let bestScore = 0;
  let bestIntentLabel = '';
  let bestPhrase = "UNKNOWN";

  for (const intent of intents) {
    let score = 0;

    // 1. Phrase matching (exact)
    for (const phrase of intent.phrases) {
      if (text.includes(phrase)) {
        score += PHRASE_SCORE;
        bestPhrase = phrase;
      }
    }

    // 2. Strong Token scoring
    let strongTokenHits = 0;
    for (const token of intent.strongTokens || []) {
      if (tokens.includes(token)) {

        score += STRONG_TOKEN_SCORE;
        strongTokenHits++;

      }
    }

    // 3. Weak Token scoring
    let weakTokenHits = 0;
    for (const token of intent.weakTokens || []) {

      if (tokens.includes(token)) {

        score += WEAK_TOKEN_SCORE;       
        weakTokenHits++;

      }
    }

    // Track the best-scoring intent
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent.id;
      bestIntentLabel = intent.label
    }
  }

  // 4. Threshold: reject weak matches
  if (bestScore < MIN_ACCEPT_SCORE) {
    return {
      intent: IntentType.UNKNOWN,
      label: "UNKNOWN",
      score: bestScore,
      matchedPhrase: bestPhrase
    };
  }

  // Find final label
  const finalIntent = intents.find(i => i.id === bestIntent)!;

  return {
    intent: finalIntent.id,
    label: finalIntent.label,
    score: bestScore,
    matchedPhrase: bestPhrase
  };
}
