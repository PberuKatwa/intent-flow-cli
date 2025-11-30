import { tokenize } from "./intent.tokenizer";
import { IntentDefinition, IntentType } from "../types/intent.types";
import { getLevenshteinDistance } from "../utils/levenshteinDistance"; 

const SCORES = {
  EXACT_PHRASE: 10,
  STRONG_TOKEN: 3,
  WEAK_TOKEN: 1,
  FUZZY_MATCH: 1.5,
  MIN_THRESHOLD: 4
};

export function detectIntent(intents: Array<IntentDefinition>, message: string) {
  console.log("\n================ DETECT INTENT START ================");
  console.log("USER MESSAGE:", message);

  const { stemmedTokens } = tokenize(message);
  console.log("TOKENIZED USER INPUT:", stemmedTokens, "\n");

  let bestIntent = { 
    id: "UNKNOWN", 
    label: "UNKNOWN", 
    score: 0, 
    matchedPhrase: null as string | null 
  };

  for (const intent of intents) {
    console.log("--------------------------------------------------");
    console.log(`INTENT: ${intent.id} (${intent.label})`);
    console.log("--------------------------------------------------");

    let score = 0;
    let matchedPhrase = null;

    const usedTokenIndices = new Set<number>();

    // ================= 1. PHRASE MATCHING =================
    console.log("\n[1] PHRASE MATCHING");
    console.log("Intent phrases:", intent.phrases);

    for (const phrase of intent.phrases) {
      const phraseTokens = tokenize(phrase).stemmedTokens;
      console.log(`\nChecking phrase: "${phrase}"`);
      console.log("Phrase tokens:", phraseTokens);

      const intersection = phraseTokens.filter(pt => stemmedTokens.includes(pt));
      console.log("Intersection with user tokens:", intersection);

      if (intersection.length === phraseTokens.length) {
        console.log("✔ FULL PHRASE MATCH FOUND!");

        stemmedTokens.forEach((t, index) => {
          if (phraseTokens.includes(t)) {
            usedTokenIndices.add(index);
            console.log(`Marked token "${t}" at index ${index} as USED`);
          }
        });

        score += SCORES.EXACT_PHRASE;
        matchedPhrase = phrase;

        console.log("Updated score (EXACT_PHRASE):", score);
        break;
      }
    }

    console.log("\nUsed tokens after phrase matching:", [...usedTokenIndices]);

    // ================= 2. STRONG TOKEN MATCHING =================
    console.log("\n[2] STRONG TOKEN SCORING");

    if (!matchedPhrase) {
      const intentStrongTokens = intent.strongTokens?.map(t => tokenize(t).stemmedTokens[0]) || [];

      console.log("Strong tokens:", intentStrongTokens);

      for (const iToken of intentStrongTokens) {
        console.log(`\nChecking strong token: "${iToken}"`);
        let found = false;

        // Exact match
        stemmedTokens.forEach((uToken, idx) => {
          if (usedTokenIndices.has(idx)) return;
          if (uToken === iToken) {
            console.log(`✔ Exact match: "${uToken}"`);
            score += SCORES.STRONG_TOKEN;
            usedTokenIndices.add(idx);
            found = true;
            console.log("Updated score (STRONG_TOKEN):", score);
          }
        });

        // Fuzzy fallback
        if (!found) {
          console.log("No exact match → checking fuzzy match…");
          stemmedTokens.forEach((uToken, idx) => {
            if (usedTokenIndices.has(idx)) return;

            if (uToken.length > 3) {
              const dist = getLevenshteinDistance(uToken, iToken);
              console.log(`Distance(${uToken}, ${iToken}) = ${dist}`);

              if (dist <= 1) {
                console.log(`✔ Fuzzy match found for "${uToken}"`);
                score += SCORES.FUZZY_MATCH;
                usedTokenIndices.add(idx);
                console.log("Updated score (FUZZY_MATCH):", score);
              }
            }
          });
        }
      }
    } else {
      console.log("Phrase already matched → skipping strong token scoring.");
    }

    console.log("\nUsed tokens after strong matching:", [...usedTokenIndices]);

    // ================= 3. WEAK TOKEN MATCHING =================
    console.log("\n[3] WEAK TOKEN SCORING");

    const intentWeakTokens = intent.weakTokens?.map(t => tokenize(t).stemmedTokens[0]) || [];
    console.log("Weak tokens:", intentWeakTokens);

    for (const wToken of intentWeakTokens) {
      console.log(`\nChecking weak token: "${wToken}"`);

      stemmedTokens.forEach((uToken, idx) => {
        if (usedTokenIndices.has(idx)) return;

        if (uToken === wToken) {
          console.log(`✔ Weak match: "${uToken}"`);
          score += SCORES.WEAK_TOKEN;
          usedTokenIndices.add(idx);
          console.log("Updated score (WEAK_TOKEN):", score);
        }
      });
    }

    console.log("\nFinal score for this intent:", score);
    console.log("Matched phrase:", matchedPhrase);
    console.log("Used tokens:", [...usedTokenIndices], "\n");

    // ================= BEST INTENT UPDATE =================
    if (score > bestIntent.score) {
      console.log("✔ Updating BEST INTENT");
      bestIntent = {
        id: intent.id,
        label: intent.label,
        score: score,
        matchedPhrase
      };
    } else {
      console.log("Not higher than current best intent → skipping");
    }

    console.log("\n--------------------------------------------------\n");
  }

  console.log("\n================ DETECT INTENT END =================");
  console.log("BEST INTENT:", bestIntent, "\n");

  if (bestIntent.score < SCORES.MIN_THRESHOLD) {
    console.log("Score below MIN_THRESHOLD → returning UNKNOWN\n");
    return { ...bestIntent, id: IntentType.UNKNOWN, label: "UNKNOWN" };
  }

  console.log("Returning best intent.\n");
  return bestIntent;
}
