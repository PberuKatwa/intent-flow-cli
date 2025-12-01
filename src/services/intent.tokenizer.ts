import natural from "natural"
const stemmer = natural.PorterStemmer.stem;

// Stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'i', 'you', 'it','for',
  'my'
]);

type TokenizedOutput = {
  originalTokens:Array<string>; 
  stemmedTokens:Array<string>; 
}

type SingleTokenOutput = {
  original: string;
  stemmed: string;
  isStopWord: boolean;
};

export function tokenize(text: string):TokenizedOutput {

  const cleanText = text.toLocaleLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean)
  
  const originalTokens:Array<string> = cleanText.filter(Boolean);

  const stemmedTokens:Array<string> = originalTokens
    .filter(t => !STOP_WORDS.has(t))
    .map(t => stemmer(t));

  return { originalTokens, stemmedTokens }
}

export function tokenizeSingleWord(text: string): SingleTokenOutput {
  
  const cleanTokens: string[] = text
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (cleanTokens.length === 0) {
    return { original: text, stemmed: '', isStopWord: false };
  }
  const originalWord = cleanTokens[0];

  const isStopWord = STOP_WORDS.has(originalWord);

  let stemmedWord = originalWord;

  if (!isStopWord) {
    stemmedWord = stemmer(originalWord);
  } else {
    stemmedWord = '';
  }

  return { 
    original: originalWord, 
    stemmed: stemmedWord, 
    isStopWord: isStopWord 
  };
}