import { tokenize } from "./intent.tokenizer";
import { IntentDefinition, IntentType } from "../types/intent.types";

const PHRASE_SCORE = 5;
const TOKEN_SCORE = 1;
const MULTI_TOKEN_BONUS = 2;
const MIN_ACCEPT_SCORE = 3; // below this → UNKNOWN

export function detectIntent(
  intents: Array<IntentDefinition>,
  message: string
) {
  const text = message.toLowerCase().trim();
  const tokens = tokenize(text);

  // Track scores
  let bestIntent = IntentType.UNKNOWN;
  let bestScore = 0;
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

    // 2. Token scoring
    let tokenHits = 0;
    for (const token of intent.tokens || []) {
      if (tokens.includes(token)) {
        score += TOKEN_SCORE;
        tokenHits++;
      }
    }

    // 3. Multi-token bonus
    if (tokenHits >= 2) {
      score += MULTI_TOKEN_BONUS;
    }

    // Track the best-scoring intent
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent.id;
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
