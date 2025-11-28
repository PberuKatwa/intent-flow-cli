import { tokenize } from "./intent.tokenizer";
import { IntentDefinition, IntentType } from "../types/intent.types";

// Scoring weights
const PHRASE_SCORE = 6;
const PARTIAL_PHRASE_MULTIPLIER = 0.6;
const STRONG_TOKEN_SCORE = 2;
const WEAK_TOKEN_SCORE = 1;
const CONSECUTIVE_TOKEN_BONUS = 1.5;
const POSITION_WEIGHT_FACTOR = 0.3;
const MIN_ACCEPT_SCORE = 2;

// Stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'i', 'you', 'it'
]);

// Negation words
const NEGATIONS = new Set([
  'not', 'no', 'never', 'dont', "don't", 'cannot', "can't",
  'wont', "won't", 'nothing', 'nowhere', 'neither'
]);

interface IntentScore {
  intent:string;
  label: string;
  score: number;
  confidence: number;
  matchedPhrase: string;
  matchedTokens: string[];
  hasNegation: boolean;
}

export function detectIntent(
  intents: Array<IntentDefinition>,
  message: string
): IntentScore {
  const results = detectMultipleIntents(intents, message, 1);
  return results[0] || {
    intent: IntentType.UNKNOWN,
    label: "UNKNOWN",
    score: 0,
    confidence: 0,
    matchedPhrase: "UNKNOWN",
    matchedTokens: [],
    hasNegation: false
  };
}

export function detectMultipleIntents(
  intents: Array<IntentDefinition>,
  message: string,
  maxResults: number = 3
): IntentScore[] {
  const text = message.toLowerCase().trim();
  const { tokens, meaningfulTokens } = tokenize(text);
  const hasNegation = detectNegation(tokens);

  const scores: IntentScore[] = [];

  for (const intent of intents) {
    const result = scoreIntent(intent, text, tokens, meaningfulTokens, hasNegation);
    
    // Apply per-intent threshold if defined
    const threshold = intent.minScore ?? MIN_ACCEPT_SCORE;
    
    if (result.score >= threshold) {
      scores.push(result);
    }
  }

  // Sort by score descending and return top N
  scores.sort((a, b) => b.score - a.score);
  
  // If no intents met threshold, return UNKNOWN
  if (scores.length === 0) {
    return [{
      intent: "UNKNOWN",
      label: "UNKNOWN",
      score: 0,
      confidence: 0,
      matchedPhrase: "UNKNOWN",
      matchedTokens: [],
      hasNegation
    }];
  }

  return scores.slice(0, maxResults);
}

function scoreIntent(
  intent: IntentDefinition,
  text: string,
  tokens: string[],
  meaningfulTokens: string[],
  hasNegation: boolean
): IntentScore {
  let score = 0;
  let matchedPhrase = "";
  const matchedTokens: string[] = [];

  // 1. Exact phrase matching
  for (const phrase of intent.phrases) {
    if (text.includes(phrase)) {
      score += PHRASE_SCORE;
      matchedPhrase = phrase;
      break; // Only count best phrase match once
    }
  }

  // 2. Partial phrase matching
  if (!matchedPhrase) {
    for (const phrase of intent.phrases) {
      const partialScore = scorePartialPhrase(phrase, meaningfulTokens);
      if (partialScore > 0) {
        score += partialScore;
        matchedPhrase = phrase + " (partial)";
        break;
      }
    }
  }

  // 3. Strong token matching with position weighting
  const strongTokenData = scoreTokens(
    intent.strongTokens || [],
    meaningfulTokens,
    STRONG_TOKEN_SCORE
  );
  score += strongTokenData.score;
  matchedTokens.push(...strongTokenData.matches);

  // 4. Weak token matching
  const weakTokenData = scoreTokens(
    intent.weakTokens || [],
    meaningfulTokens,
    WEAK_TOKEN_SCORE
  );
  score += weakTokenData.score;
  matchedTokens.push(...weakTokenData.matches);

  // 5. Consecutive token bonus
  const consecutiveBonus = calculateConsecutiveBonus(
    [...(intent.strongTokens || []), ...(intent.weakTokens || [])],
    meaningfulTokens
  );
  score += consecutiveBonus;

  // 6. Apply negation penalty if intent can be negated
  if (hasNegation && (intent.canBeNegated ?? true)) {
    score *= 0.3;
  }

  // 7. Calculate confidence
  const maxPossibleScore = calculateMaxScore(intent);
  const confidence = maxPossibleScore > 0 
    ? Math.min(100, (score / maxPossibleScore) * 100)
    : 0;

  // 8. Apply intent priority/weight if defined
  if (intent.priority) {
    score *= intent.priority;
  }

  return {
    intent: intent.id,
    label: intent.label,
    score: Math.round(score * 100) / 100,
    confidence: Math.round(confidence),
    matchedPhrase: matchedPhrase || "UNKNOWN",
    matchedTokens: [...new Set(matchedTokens)], // Remove duplicates
    hasNegation
  };
}

function scorePartialPhrase(phrase: string, tokens: string[]): number {
  const phraseTokens = phrase.split(' ').filter(t => !STOP_WORDS.has(t));
  const matchedCount = phraseTokens.filter(pt => tokens.includes(pt)).length;
  
  if (matchedCount === 0) return 0;
  
  const matchRatio = matchedCount / phraseTokens.length;
  return PHRASE_SCORE * PARTIAL_PHRASE_MULTIPLIER * matchRatio;
}

function scoreTokens(
  intentTokens: string[],
  messageTokens: string[],
  baseScore: number
): { score: number; matches: string[] } {
  let totalScore = 0;
  const matches: string[] = [];

  for (const token of intentTokens) {
    const tokenIndex = messageTokens.indexOf(token);
    if (tokenIndex !== -1) {
      // Position weight: earlier tokens score slightly higher
      const positionWeight = 1 - (tokenIndex / messageTokens.length) * POSITION_WEIGHT_FACTOR;
      totalScore += baseScore * positionWeight;
      matches.push(token);
    }
  }

  return { score: totalScore, matches };
}

function calculateConsecutiveBonus(
  intentTokens: string[],
  messageTokens: string[]
): number {
  let maxConsecutive = 0;
  let currentConsecutive = 0;

  for (let i = 0; i < messageTokens.length; i++) {
    if (intentTokens.includes(messageTokens[i])) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  }

  return maxConsecutive > 1 
    ? (maxConsecutive - 1) * CONSECUTIVE_TOKEN_BONUS 
    : 0;
}

function detectNegation(tokens: string[]): boolean {
  return tokens.some(token => NEGATIONS.has(token));
}

function calculateMaxScore(intent: IntentDefinition): number {
  const phraseScore = intent.phrases.length > 0 ? PHRASE_SCORE : 0;
  const strongScore = (intent.strongTokens?.length || 0) * STRONG_TOKEN_SCORE;
  const weakScore = (intent.weakTokens?.length || 0) * WEAK_TOKEN_SCORE;
  
  return phraseScore + strongScore + weakScore;
}

// Helper function for debugging
export function explainIntentDetection(
  intents: Array<IntentDefinition>,
  message: string
): string {
  const results = detectMultipleIntents(intents, message, 5);
  
  let explanation = `Message: "${message}"\n\n`;
  explanation += `Top Intent Matches:\n`;
  explanation += `${'='.repeat(50)}\n\n`;
  
  results.forEach((result, index) => {
    explanation += `${index + 1}. ${result.label}\n`;
    explanation += `   Score: ${result.score} | Confidence: ${result.confidence}%\n`;
    explanation += `   Matched Phrase: ${result.matchedPhrase}\n`;
    explanation += `   Matched Tokens: [${result.matchedTokens.join(', ')}]\n`;
    explanation += `   Has Negation: ${result.hasNegation}\n\n`;
  });
  
  return explanation;
}