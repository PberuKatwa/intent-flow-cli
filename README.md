IntentFlow CLI 🌊A lightweight, zero-dependency heuristic NLP engine for mapping text to intents using weighted scoring.IntentFlow is a TypeScript-based intent recognition tool. It avoids the "black box" of Machine Learning in favor of a transparent, rule-based approach. It uses a combination of Phrase Regexes (strong signals) and Stemmed Tokens (weak signals) to calculate a confidence score and determine the user's intent.🚀 FeaturesDeterministic: No "hallucinations." If the rules match, the intent is found.Weighted Scoring: Prioritizes exact phrases over loose keywords.Ambiguity Handling: Returns UNKNOWN if the top score doesn't beat the runner-up by a defined margin.Blazing Fast: No heavy ML models to load; just pure string manipulation and math.TypeScript: Type-safe and easily extensible.📦 InstallationBash# Clone the repository
git clone https://github.com/your-username/intent-flow-cli.git

# Install dependencies
npm install

# Build the project
npm run build
💻 UsageCLI ModeYou can run the engine directly from the terminal to test phrases.Bashnpm start -- "where is my order?"
Output:JSON{
  "intent": 2,
  "label": "track",
  "score": 4,
  "details": {
    "phrases": ["where is my order"],
    "tokens": ["where", "order"]
  }
}
Programmatic UsageImport the service into your own backend or bot logic.TypeScriptimport { detectIntent, IntentType } from './services/intent.service';

const userInput = "I want to pay for my flowers";
const result = detectIntent(userInput);

if (result.intent === IntentType.PAY) {
    // Execute payment logic
    console.log("Initiating payment protocol...");
} else {
    console.log("Sorry, I didn't understand.");
}
🧠 How It WorksThe engine uses a point-based system to "compete" for the best intent:Normalization: The input is lowercased, and special characters are removed.Phrase Matching (Weight: 3): The engine checks against defined Regex patterns (e.g., /where is my order/). These are high-value matches.Token Matching (Weight: 1): The engine splits the text into words and "stems" them (removes 'ing', 'ed', etc.). It looks for keywords like pay, track, or buy.Multi-Hit Bonus: If a sentence hits multiple distinct tokens for a single intent, it gets a bonus point.Confidence Check:The score must be $\ge 3$ (MIN_CONFIDENCE).The winning score must beat the second-best score by at least $2$ points (MIN_MARGIN).⚙️ ConfigurationYou can customize the intents in services/intent.service.ts.TypeScriptexport enum IntentType {
  UNKNOWN = 0,
  MAKE = 1,
  TRACK = 2,
  PAY = 3,
  // Add new ID here
  CANCEL = 4
}

// Add the definition
{
  id: IntentType.CANCEL,
  label: "cancel",
  phraseRegexes: [ /\b(cancel my order|stop delivery)\b/ ],
  tokens: [ "cancel", "stop", "void" ]
}
🤝 ContributingPull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.