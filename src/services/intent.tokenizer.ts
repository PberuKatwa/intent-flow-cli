const natural = require('natural')
const stemmer = natural.PorterStemmer.stem;

// Stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'i', 'you', 'it','for'
]);

type TokenizedOutput = {
  originalTokens:Array<string>; 
  stemmedTokens:Array<string>; 
}

export function tokenize(text: string):TokenizedOutput {

  const cleanText = text.toLocaleLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean)
  
  const originalTokens:Array<string> = cleanText.filter(Boolean);

  const stemmedTokens:Array<string> = originalTokens
    .filter(t => !STOP_WORDS.has(t))
    .map(t => stemmer(t));

  return { originalTokens, stemmedTokens }
}