// Stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'i', 'you', 'it'
]);

export function tokenize(text: string): string[] {

  const tokenizedText = text.toLocaleLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean)
  const meaningfulTokens = tokenizedText.filter(t => !STOP_WORDS.has(t));

  console.log("tokenized text", tokenizedText)
  console.log("meaningful", meaningfulTokens)

  return meaningfulTokens
}
