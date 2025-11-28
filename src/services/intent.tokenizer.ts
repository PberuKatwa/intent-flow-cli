// Stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'i', 'you', 'it','for',
  'order'
]);

type TokenizedOutput = {
  tokens:Array<string>;
  meaningfulTokens:Array<string>;
}

export function tokenize(text: string):TokenizedOutput {

  const tokens:Array<string> = text.toLocaleLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean)
  const meaningfulTokens:Array<string> = tokens.filter(t => !STOP_WORDS.has(t));

  return { tokens, meaningfulTokens }
}

// export function tokenizePhrase(phrase:string): Array<string>{
//   const phrasetokens:Array<string> = phrase.toLocaleLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean)
//   const meaningfulPhrases: Array<string> = 
// }
