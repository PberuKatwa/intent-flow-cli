// intent.tokenizer.ts
import { stemmer } from "../utils/porterStemmer"; // <-- Import the new stemmer

// [// Stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'i', 'you', 'it','for',
  'order'
]);

type TokenizedOutput = {
  originalTokens:Array<string>; // Renamed for clarity
  stemmedTokens:Array<string>; // Renamed for clarity
}

export function tokenize(text: string):TokenizedOutput {

  const cleanText = text.toLocaleLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean)
  
  const originalTokens:Array<string> = cleanText.filter(Boolean);

  // Apply stemming and stop word filtering
  const stemmedTokens:Array<string> = originalTokens
    .filter(t => !STOP_WORDS.has(t))
    .map(t => stemmer(t)); // <-- Use the custom stemmer here

  return { originalTokens, stemmedTokens }
}