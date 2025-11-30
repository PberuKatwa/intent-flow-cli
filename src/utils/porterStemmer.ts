/**
 * Complete implementation of the Porter Stemming Algorithm
 * All 5 steps with comprehensive suffix handling
 */

function isVowel(char: string, word: string, index: number): boolean {
  const vowels = 'aeiou';
  if (vowels.includes(char)) return true;
  // 'y' is a vowel if preceded by a consonant
  if (char === 'y' && index > 0 && !isVowel(word[index - 1], word, index - 1)) {
    return true;
  }
  return false;
}

function measure(word: string): number {
  let m = 0;
  let prevWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const currIsVowel = isVowel(word[i], word, i);
    
    if (prevWasVowel && !currIsVowel) {
      m++;
    }
    prevWasVowel = currIsVowel;
  }
  return m;
}

function containsVowel(word: string): boolean {
  for (let i = 0; i < word.length; i++) {
    if (isVowel(word[i], word, i)) return true;
  }
  return false;
}

function endsWithDoubleConsonant(word: string): boolean {
  if (word.length < 2) return false;
  const last = word[word.length - 1];
  const secondLast = word[word.length - 2];
  return last === secondLast && !isVowel(last, word, word.length - 1);
}

function endsWithCVC(word: string): boolean {
  if (word.length < 3) return false;
  const len = word.length;
  const lastIsConsonant = !isVowel(word[len - 1], word, len - 1);
  const secondLastIsVowel = isVowel(word[len - 2], word, len - 2);
  const thirdLastIsConsonant = !isVowel(word[len - 3], word, len - 3);
  
  // Should not end with w, x, or y
  const notWXY = !['w', 'x', 'y'].includes(word[len - 1]);
  
  return thirdLastIsConsonant && secondLastIsVowel && lastIsConsonant && notWXY;
}

function replaceEnding(word: string, suffix: string, replacement: string, minMeasure: number = 0): string {
  if (!word.endsWith(suffix)) return word;
  const stem = word.slice(0, -suffix.length);
  if (measure(stem) > minMeasure) {
    return stem + replacement;
  }
  return word;
}

export function stemmer(word: string): string {
  word = word.toLowerCase();
  if (word.length < 3) return word;
  
  let originalWord = word;

  // Step 1a: Plurals
  if (word.endsWith('sses')) {
    word = word.slice(0, -2);
  } else if (word.endsWith('ies')) {
    word = word.slice(0, -2);
  } else if (word.endsWith('ss')) {
    // Keep as is
  } else if (word.endsWith('s')) {
    word = word.slice(0, -1);
  }

  // Step 1b: Past tense
  if (word.endsWith('eed')) {
    if (measure(word.slice(0, -3)) > 0) {
      word = word.slice(0, -1);
    }
  } else {
    let suffix = '';
    if (word.endsWith('ed')) {
      suffix = 'ed';
    } else if (word.endsWith('ing')) {
      suffix = 'ing';
    }
    
    if (suffix) {
      const stem = word.slice(0, -suffix.length);
      if (containsVowel(stem)) {
        word = stem;
        
        // Apply additional rules
        if (word.endsWith('at') || word.endsWith('bl') || word.endsWith('iz')) {
          word += 'e';
        } else if (endsWithDoubleConsonant(word) && !['l', 's', 'z'].includes(word[word.length - 1])) {
          word = word.slice(0, -1);
        } else if (measure(word) === 1 && endsWithCVC(word)) {
          word += 'e';
        }
      }
    }
  }

  // Step 1c: Y to I
  if (word.length > 2 && word.endsWith('y') && !isVowel(word[word.length - 2], word, word.length - 2)) {
    word = word.slice(0, -1) + 'i';
  }

  // Step 2: Common suffixes
  const step2Map: [string, string][] = [
    ['ational', 'ate'],
    ['tional', 'tion'],
    ['enci', 'ence'],
    ['anci', 'ance'],
    ['izer', 'ize'],
    ['abli', 'able'],
    ['alli', 'al'],
    ['entli', 'ent'],
    ['eli', 'e'],
    ['ousli', 'ous'],
    ['ization', 'ize'],
    ['ation', 'ate'],
    ['ator', 'ate'],
    ['alism', 'al'],
    ['iveness', 'ive'],
    ['fulness', 'ful'],
    ['ousness', 'ous'],
    ['aliti', 'al'],
    ['iviti', 'ive'],
    ['biliti', 'ble'],
  ];

  for (const [suffix, replacement] of step2Map) {
    if (word.endsWith(suffix)) {
      const stem = word.slice(0, -suffix.length);
      if (measure(stem) > 0) {
        word = stem + replacement;
        break;
      }
    }
  }

  // Step 3: More suffixes
  const step3Map: [string, string][] = [
    ['icate', 'ic'],
    ['ative', ''],
    ['alize', 'al'],
    ['iciti', 'ic'],
    ['ical', 'ic'],
    ['ful', ''],
    ['ness', ''],
  ];

  for (const [suffix, replacement] of step3Map) {
    if (word.endsWith(suffix)) {
      const stem = word.slice(0, -suffix.length);
      if (measure(stem) > 0) {
        word = stem + replacement;
        break;
      }
    }
  }

  // Step 4: Remove suffixes with m > 1
  const step4Suffixes = [
    'al', 'ance', 'ence', 'er', 'ic', 'able', 'ible', 'ant',
    'ement', 'ment', 'ent', 'ion', 'ou', 'ism', 'ate', 'iti', 'ous', 'ive', 'ize'
  ];

  for (const suffix of step4Suffixes) {
    if (word.endsWith(suffix)) {
      const stem = word.slice(0, -suffix.length);
      
      // Special case for 'ion'
      if (suffix === 'ion' && stem.length > 0) {
        const lastChar = stem[stem.length - 1];
        if ((lastChar === 's' || lastChar === 't') && measure(stem) > 1) {
          word = stem;
          break;
        }
      } else if (measure(stem) > 1) {
        word = stem;
        break;
      }
    }
  }

  // Step 5a: Remove 'e'
  if (word.endsWith('e')) {
    const stem = word.slice(0, -1);
    const m = measure(stem);
    if (m > 1 || (m === 1 && !endsWithCVC(stem))) {
      word = stem;
    }
  }

  // Step 5b: Remove double 'l'
  if (word.endsWith('ll') && measure(word) > 1) {
    word = word.slice(0, -1);
  }

  return word;
}

// Example usage and testing
if (typeof window !== 'undefined') {
  (window as any).testStemmer = () => {
    const testWords = [
      'caresses', 'flies', 'dies', 'mules', 'denied',
      'agreed', 'plastered', 'bled', 'motoring', 'sing',
      'conflated', 'troubled', 'sized', 'hopping', 'tanned',
      'falling', 'hissing', 'fizzed', 'failing', 'filing',
      'happy', 'sky', 'relational', 'conditional', 'rational',
      'valenci', 'hesitanci', 'digitizer', 'conformabli',
      'radicalli', 'differentli', 'vileli', 'analogousli',
      'vietnamization', 'predication', 'operator', 'feudalism',
      'decisiveness', 'hopefulness', 'callousness', 'formaliti',
      'sensitiviti', 'sensibiliti', 'triplicate', 'formative',
      'formalize', 'electriciti', 'electrical', 'hopeful',
      'goodness', 'revival', 'allowance', 'inference',
      'airliner', 'gyroscopic', 'adjustable', 'defensible',
      'irritant', 'replacement', 'adjustment', 'dependent',
      'adoption', 'homologou', 'communism', 'activate',
      'angulariti', 'homologous', 'effective', 'bowdlerize'
    ];

    console.log('Porter Stemmer Test Results:');
    console.log('============================');
    testWords.forEach(word => {
      console.log(`${word.padEnd(20)} -> ${stemmer(word)}`);
    });
  };
}