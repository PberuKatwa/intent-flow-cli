/**
 * A simplified, self-contained implementation of the Porter Stemming Algorithm.
 * This is widely used for English language text processing.
 */

// Helper function to check if a character is a vowel
function isVowel(char: string): boolean {
    return 'aeiou'.includes(char);
}

// Helper function to measure the "measure" (m) of a word 
// (number of Vowel-Consonant sequences, used for rule constraints)
function measure(word: string): number {
    let m = 0;
    let inConsonantSequence = true; // Start assuming we're looking for V
    
    for (const char of word) {
        const isC = !isVowel(char);
        
        if (inConsonantSequence && !isC) { // C -> V transition
            inConsonantSequence = false;
        } else if (!inConsonantSequence && isC) { // V -> C transition (starts a new m)
            m++;
            inConsonantSequence = true;
        }
    }
    return m;
}

// Function to check if a word contains a vowel
function containsVowel(word: string): boolean {
    return Array.from(word).some(isVowel);
}

// Function to check if the last two letters are a double consonant (e.g., 'bb', 'tt')
function isDoubleConsonant(word: string): boolean {
    const len = word.length;
    if (len < 2) return false;
    const last = word[len - 1];
    const secondLast = word[len - 2];
    
    return last === secondLast && !isVowel(last) && last !== 'y';
}

// The main stemming function
export function stemmer(word: string): string {
    if (word.length < 3) return word;

    // Step 1a: Plural forms
    if (word.endsWith('sses')) {
        word = word.slice(0, -2); // e.g., 'caresses' -> 'caress'
    } else if (word.endsWith('ies')) {
        word = word.slice(0, -2); // e.g., 'ties' -> 'ti'
    } else if (word.endsWith('ss')) {
        // No change for 'ss'
    } else if (word.endsWith('s')) {
        word = word.slice(0, -1); // e.g., 'cats' -> 'cat'
    }

    // Step 1b: Past tense and -ing forms
    let changed = false;
    if (word.endsWith('eed')) {
        if (measure(word.slice(0, -3)) > 0) {
            word = word.slice(0, -1); // e.g., 'agreed' -> 'agree'
        }
        changed = true;
    } else if (word.endsWith('ed')) {
        const prefix = word.slice(0, -2);
        if (containsVowel(prefix)) {
            word = prefix;
            changed = true;
        }
    } else if (word.endsWith('ing')) {
        const prefix = word.slice(0, -3);
        if (containsVowel(prefix)) {
            word = prefix;
            changed = true;
        }
    }

    // Step 1b part 2: Special consonant endings
    if (changed) {
        if (word.endsWith('at') || word.endsWith('bl') || word.endsWith('iz')) {
            word += 'e'; // e.g., 'rate'
        } else if (isDoubleConsonant(word)) {
            word = word.slice(0, -1); // e.g., 'runn' -> 'run'
        } else if (measure(word) === 1 && word.endsWith('l') && isDoubleConsonant(word + 'l')) {
            // Special rule often needed, but simplified here for brevity
        }
    }
    
    // Step 1c: 'y' to 'i' when preceded by a consonant
    if (word.endsWith('y') && word.length > 2 && !isVowel(word[word.length - 2])) {
        word = word.slice(0, -1) + 'i'; // e.g., 'happy' -> 'happi'
    }

    // NOTE: For brevity and simplicity, subsequent steps (2, 3, 4, 5) 
    // involving complex suffix stripping (e.g., -tional, -iveness) 
    // are omitted. The steps above cover the most frequent inflections.

    return word;
}