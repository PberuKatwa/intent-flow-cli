Intent Flow CLI

A lightweight, pattern-based NLP intent classification engine for Node.js and TypeScript. Intent Flow CLI classifies user input into predefined intents using regex patterns, token matching, and fuzzy logic without external API dependencies.

Features

Multi-layered Intent Matching: Combines exact phrase matching, strong/weak token scoring, and fuzzy matching (Levenshtein distance) for robust detection.

Robust Validation: Uses Zod schemas to ensure intent definition files are valid before loading.

Smart Tokenization: Implements Porter Stemmer algorithm with custom stop-word filtering.

Structured Logging: Integrated Winston logger for debugging and error tracking.

Interactive CLI: Real-time intent detection loop.

Extensible: Load custom intent definitions from JSON files.

Table of Contents

Installation

Quick Start

Project Structure

How It Works

Intent Definition

Scoring System

Development

Installation

# Clone the repository
git clone [https://github.com/PberuKatwa/intent-flow-cli.git](https://github.com/PberuKatwa/intent-flow-cli.git)

# Navigate to project directory
cd intent-flow-cli

# Install dependencies
npm install

# Build the project
npm run build


Dependencies

Core: natural, stemmer (NLP processing)

Utilities: chalk (Terminal styling), winston (Logging)

Validation: zod (Schema validation)

Dev: typescript, ts-node

Quick Start

You can run the CLI directly in development mode:

# Start the CLI using ts-node/esm loader
npm start
# OR
npm run dev


Interactive Session Example:

INTENT FLOW CLI
Enter your message

> I want to order flowers
[Detected: MAKE_ORDER] (Score: 10)

> How much do I owe?
[Detected: PAY_FOR_ORDER] (Score: 10)

> where is my package
[Detected: TRACK_ORDER] (Score: 6.5)


Project Structure

src/
├── cli.ts                        # Entry point
├── files/
│   └── default.json              # Default intent definitions
├── services/
│   ├── cli.client.ts             # CLI UI and Interaction loop
│   ├── intent.definition.ts      # Intent Logic/Classes
│   ├── intent.loader.ts          # File loading service
│   ├── intent.matcher.ts         # Scoring & Matching Engine
│   └── intent.tokenizer.ts       # Text normalization & Stemming
├── types/
│   └── intent.types.ts           # TypeScript Interfaces
├── utils/
│   └── logger.ts                 # Winston logger configuration
└── validators/
    └── intent.schema.ts          # Zod validation schemas


How It Works

Intent Flow CLI processes user input through three main stages:

1. Tokenization (intent.tokenizer.ts)

The tokenizer cleans, normalizes, and stems input text. It filters out common stop words (e.g., 'the', 'is', 'for', 'my').

Input: "I want to order flowers"
→ Cleaned: ["i", "want", "to", "order", "flowers"]
→ Stemmed: ["want", "order", "flower"] // Stop words removed, stems applied


2. Intent Matching (intent.matcher.ts)

The matcher calculates a score for every available intent based on the user's input.

Phrase Matching (Highest Priority)

Exact Match: Score 10.

Partial Match: If a significant portion of a phrase matches, a partial score is applied using a 0.5 multiplier.

Strong Token Matching

Exact Token Match: +3 points.

Fuzzy Match: If a word is within a Levenshtein distance of 1 (e.g., "ordr" vs "order"), it awards +1.5 points.

Weak Token Matching

Exact Token Match: +1 point.

3. Result Determination

The engine returns the BestIntent. If the highest score is below the Minimum Threshold (4), the system returns UNKNOWN.

Intent Definition

Intents are defined in JSON files (e.g., src/files/default.json). The structure is validated using Zod.

[
  {
    "id": "MAKE_ORDER",
    "label": "Make Order",
    "phrases": [
      "place an order",
      "i want to order"
    ],
    "strongTokens": ["order", "buy", "purchase"],
    "weakTokens": ["want", "need", "flower"]
  }
]


Scoring System

The scoring constants are defined in src/services/intent.matcher.ts:

Match Type

Score

Description

Exact Phrase

10

Perfect match with a defined phrase.

Strong Token

3

Exact match with a high-value keyword.

Fuzzy Match

1.5

Strong token match with typo (Distance ≤ 1).

Weak Token

1

Match with a supporting keyword.

Threshold

4

Minimum score required to classify intent.

Calculation Example

Intent Definition:

Strong: ["cancel"]

Weak: ["order"]

Input: "Cancl order"

Tokenize: ["cancl", "order"]

Match:

"cancl" ≈ "cancel" (Fuzzy match): +1.5

"order" == "order" (Weak match): +1.0

Total Score: 2.5

Result: UNKNOWN (Score < 4.0 threshold)

Development

Scripts

npm run build: Compiles TypeScript to dist/.

npm start: Runs the CLI from source using ts-node/esm.

npm run dev: Alias for start.

adding New Intents

Modify src/files/default.json.

Ensure your JSON matches the schema in src/validators/intent.schema.ts.

Restart the CLI.

