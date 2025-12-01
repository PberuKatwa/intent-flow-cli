# Intent Flow CLI

A powerful, flexible command-line tool for detecting user intent from natural language text. Intent Flow CLI uses advanced NLP techniques including tokenization, stemming, phrase matching, and fuzzy matching to accurately classify user messages into predefined intents.

## Features

- **Multi-layered Intent Matching**: Combines exact phrase matching, strong/weak token scoring, and fuzzy matching for robust intent detection
- **Configurable Intent Definitions**: Easy-to-define intents with phrases, strong tokens, and weak tokens
- **Smart Tokenization**: Porter Stemmer algorithm with stop word filtering for accurate text processing
- **Interactive CLI**: Real-time intent detection with detailed match reporting
- **Extensible Architecture**: Load custom intent definitions from JSON files
- **Type-Safe**: Built with TypeScript and Zod schema validation
- **Structured Logging**: Winston-powered logging for debugging and monitoring

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Intent Definition](#intent-definition)
- [Configuration](#configuration)
- [Scoring System](#scoring-system)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## Installation

```bash
# Clone the repository
git clone https://github.com/PberuKatwa/intent-flow-cli.git

# Navigate to project directory
cd intent-flow-cli

# Install dependencies
npm install

# Build the project
npm run build

# Run the CLI
npm start
# or for development
npm run dev
```

### Dependencies

- **natural** (v8.1.0): NLP library for stemming and string distance calculations
- **chalk** (v5.6.2): Terminal string styling
- **winston** (v3.18.3): Structured logging
- **zod** (v4.1.13): Schema validation
- **stemmer** (v2.0.1): Additional stemming support
- **typescript** (v5.9.3): Type-safe JavaScript development

## Quick Start

```bash
# Start the CLI
npm start

# Try some messages:
> I want to order flowers
> Where is my order?
> How much do I owe?
> exit
```

## How It Works

Intent Flow CLI processes user input through three main stages:

### 1. Tokenization (`intent.tokenizer.ts`)

The tokenizer cleans, normalizes, and stems input text using the Porter Stemmer algorithm:

```typescript
Input: "I want to order flowers"
→ Original Tokens: ["i", "want", "to", "order", "flowers"]
→ Stemmed Tokens: ["want", "order", "flower"] // Stop words removed
```

**Features:**
- Lowercase normalization
- Punctuation removal
- Stop word filtering (the, a, an, is, are, my, etc.)
- Porter Stemmer algorithm for word stemming
- Single word tokenization support

### 2. Intent Matching (`intent.matcher.ts`)

The matcher scores each intent definition against the input using multiple strategies:

#### Phrase Matching (Highest Priority)
- Compares input against predefined phrases using normalized Jaccard similarity
- **Exact match** (100% match with phrase length > 1): Returns immediately with score 10
- **Partial match** (>0% match with phrase length > 2): Applies score with partial multiplier (0.5)

#### Strong Token Matching
- Matches against high-confidence keywords
- **Exact match**: +3 points
- **Fuzzy match** (Levenshtein distance ≤ 1): +1.5 points

#### Weak Token Matching
- Matches against supporting keywords
- **Exact match**: +1 point

#### Token Usage Prevention
- Uses a `usedTokenIndices` set to prevent double-scoring of tokens
- Each token can only contribute to one scoring category

### 3. Result Determination

The function returns a `BestIntent` object with detailed match information:

```typescript
{
  id: "MAKE_ORDER",
  label: "Make Order",
  score: 8.5,
  matchedPhrase: "place an order",
  partialPhrases: [],
  strongTokens: ["order"],
  weakTokens: ["want", "flower"],
  fuzzyTokens: []
}
```

Returns `UNKNOWN` if score < 4 (minimum threshold).

## Intent Definition

Intents are defined using the `IntentDefinition` interface with Zod validation:

```typescript
{
  id: "MAKE_ORDER",           // Unique identifier
  label: "Make Order",         // Human-readable label
  
  phrases: [                   // Exact or partial phrase matches
    "place an order",
    "make an order",
    "i want to order",
    "buy flowers"
  ],
  
  strongTokens: [              // High-confidence keywords
    "order", "buy", "purchase", "send", "place", "checkout", "book", "reserve"
  ],
  
  weakTokens: [                // Supporting keywords
    "want", "like", "need", "get", "give", "take", "flower", "flowers", 
    "arrangement", "bouquet"
  ]
}
```

### Built-in Intents

The CLI comes with three example intents in `default.json`:

| Intent ID | Purpose | Example Phrases |
|-----------|---------|-----------------|
| `MAKE_ORDER` | User wants to purchase | "place an order", "buy flowers", "i want to order" |
| `TRACK_ORDER` | User checking delivery status | "where is my order", "track my order", "has my order arrived" |
| `PAY_FOR_ORDER` | User inquiring about payment | "how much do i owe", "what do i need to pay", "payment due" |

## Configuration

### Loading Custom Intents

Create a JSON file with your intent definitions:

```json
[
  {
    "id": "CANCEL_ORDER",
    "label": "Cancel Order",
    "phrases": [
      "cancel my order",
      "i want to cancel",
      "stop my order"
    ],
    "strongTokens": ["cancel", "stop", "abort", "terminate"],
    "weakTokens": ["order", "purchase", "don't", "want"]
  }
]
```

Load it in your code:

```typescript
import { loadIntentsFromFile } from './services/intent.loader';

const customIntents = loadIntentsFromFile('./path/to/intents.json');
const result = detectIntent(customIntents, userMessage);
```

### Adjusting Scoring Parameters

Modify the scoring constants in `services/intent.matcher.ts`:

```typescript
const SCORES = {
  EXACT_PHRASE: 10,              // Full phrase match
  STRONG_TOKEN: 3,               // Strong keyword match
  WEAK_TOKEN: 1,                 // Weak keyword match
  FUZZY_MATCH: 1.5,              // Fuzzy string match (Levenshtein ≤ 1)
  MIN_THRESHOLD: 4,              // Minimum score for detection
  PARTIAL_PHRASE_MULTIPLIER: 0.5 // Multiplier for partial phrase matches
};
```

### Stop Words Configuration

Customize stop words in `services/intent.tokenizer.ts`:

```typescript
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'i', 'you', 'it', 'for', 'my'
]);
```

## Scoring System

### Score Calculation Example

**Input**: "I need to buy flowers"

**Processing**:
1. Tokenize → `["need", "buy", "flower"]`
2. Check phrases:
   - "buy flowers" → 2/2 tokens match → 100% match ratio → +10 points (exact match)
3. Return immediately with `MAKE_ORDER`

**Alternative Input**: "want to get some flowers"

1. Tokenize → `["want", "get", "flower"]`
2. Check phrases → No exact matches, no partial matches with >2 tokens
3. Strong tokens:
   - "get" ≈ "buy" (Levenshtein distance = 3) → No score
4. Weak tokens:
   - "want" → +1
   - "flower" → +1
5. **Total**: 2 points → Below threshold (4) → `UNKNOWN`

**Complex Input**: "I'd like to place an order"

1. Tokenize → `["like", "place", "order"]`
2. Check phrases:
   - "place an order" → 2/3 tokens match (66.7%) → Partial match → +3.35 points
3. Strong tokens:
   - "place" → Already used in phrase matching (skipped)
   - "order" → Already used in phrase matching (skipped)
4. Weak tokens:
   - "like" → +1
5. **Total**: 4.35 points → Above threshold → `MAKE_ORDER`

## API Reference

### `tokenize(text: string): TokenizedOutput`

Tokenizes and stems input text, filtering out stop words.

```typescript
const result = tokenize("I want to order");
// Returns:
// {
//   originalTokens: ["i", "want", "to", "order"],
//   stemmedTokens: ["want", "order"]
// }
```

### `tokenizeSingleWord(text: string): SingleTokenOutput`

Tokenizes a single word with stop word detection.

```typescript
const result = tokenizeSingleWord("ordering");
// Returns:
// {
//   original: "ordering",
//   stemmed: "order",
//   isStopWord: false
// }
```

### `detectIntent(intents: ReadOnlyIntentDefinition[], message: string): BestIntent`

Detects the best matching intent for a message.

```typescript
const result = detectIntent(allIntents, "track my order");
// Returns:
// {
//   id: "TRACK_ORDER",
//   label: "Track Order",
//   score: 10,
//   matchedPhrase: "track my order",
//   partialPhrases: [],
//   strongTokens: ["track"],
//   weakTokens: ["my"],
//   fuzzyTokens: []
// }
```

### `loadIntentsFromFile(filePath: string): IntentDefinition[]`

Loads and validates intent definitions from a JSON file using Zod schema validation.

```typescript
const intents = loadIntentsFromFile('./files/custom.json');
```

## Examples

### Example 1: E-commerce Bot

```typescript
const ecommerceIntents = [
  {
    id: "ADD_TO_CART",
    label: "Add to Cart",
    phrases: ["add to cart", "put in basket", "add this"],
    strongTokens: ["add", "cart", "basket"],
    weakTokens: ["want", "like", "this", "item"]
  },
  {
    id: "CHECK_PRICE",
    label: "Check Price",
    phrases: ["how much", "what's the price", "cost of"],
    strongTokens: ["price", "cost", "much", "expensive"],
    weakTokens: ["how", "what", "tell", "show"]
  }
];

detectIntent(ecommerceIntents, "add this to my cart");
// Returns: ADD_TO_CART with high confidence
```

### Example 2: Customer Support Bot

```typescript
const supportIntents = [
  {
    id: "REPORT_BUG",
    label: "Report Bug",
    phrases: ["report a bug", "something is broken", "not working"],
    strongTokens: ["bug", "broken", "error", "issue", "crash"],
    weakTokens: ["report", "problem", "not", "working", "help"]
  },
  {
    id: "REQUEST_FEATURE",
    label: "Request Feature",
    phrases: ["add a feature", "i want a feature", "can you add"],
    strongTokens: ["feature", "add", "request", "want", "need"],
    weakTokens: ["new", "would", "like", "could"]
  }
];
```

### Example 3: Restaurant Booking Bot

```typescript
const restaurantIntents = [
  {
    id: "BOOK_TABLE",
    label: "Book Table",
    phrases: ["book a table", "make a reservation", "reserve a table"],
    strongTokens: ["book", "reserve", "table", "reservation"],
    weakTokens: ["want", "need", "for", "people", "tonight"]
  },
  {
    id: "CHECK_MENU",
    label: "Check Menu",
    phrases: ["show menu", "what's on the menu", "see the menu"],
    strongTokens: ["menu", "food", "dishes", "options"],
    weakTokens: ["show", "see", "what", "have"]
  }
];
```

## Project Structure

```
intent-flow-cli/
├── src/
│   ├── cli.ts                     # Main CLI entry point
│   ├── services/
│   │   ├── cli.client.ts          # CLI client interface
│   │   ├── intent.definition.ts   # Built-in intent definitions
│   │   ├── intent.tokenizer.ts    # Tokenization & stemming logic
│   │   ├── intent.matcher.ts      # Intent matching algorithm
│   │   └── intent.loader.ts       # JSON intent file loader
│   ├── types/
│   │   └── intent.types.ts        # TypeScript type definitions
│   ├── utils/
│   │   └── logger.ts              # Winston logger configuration
│   ├── validators/
│   │   └── intent.schema.ts       # Zod validation schemas
│   └── files/
│       └── default.json            # Default intent definitions
├── dist/                           # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

## Type Definitions

### IntentDefinition
```typescript
interface IntentDefinition {
  id: string;
  label: string;
  phrases: string[];
  strongTokens?: string[];
  weakTokens?: string[];
}
```

### BestIntent
```typescript
interface BestIntent {
  id: string;
  label: string;
  score: number;
  matchedPhrase?: string;
  partialPhrases?: string[];
  strongTokens?: string[];
  weakTokens?: string[];
  fuzzyTokens?: string[];
}
```

### TokenizedOutput
```typescript
interface TokenizedOutput {
  originalTokens: string[];
  stemmedTokens: string[];
}
```

## Development

### Scripts

```bash
# Build TypeScript to JavaScript
npm run build

# Start CLI (production)
npm start

# Start CLI (development with ts-node)
npm run dev

# Run tests
npm test
```

### ESM Configuration

This project uses ES Modules (ESM). Key configuration details:

**package.json:**
```json
{
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2020"
  }
}
```

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Write clear, documented code
- Add Zod schemas for new data structures
- Follow existing code style (ESM imports, TypeScript strict mode)
- Update README for significant changes
- Use Winston logger for all logging
- Validate inputs with Zod schemas

## Troubleshooting

### Common Issues

**ESM Import Errors:**
```bash
# Make sure you're using Node.js 18+ and have "type": "module" in package.json
node --version  # Should be >= 18.0.0
```

**Chalk Import Issues:**
```bash
# Chalk v5+ is ESM-only. Use dynamic import if needed:
const chalk = await import('chalk');
```

**Natural Library Issues:**
```bash
# If stemming doesn't work, ensure natural is properly installed
npm install natural --save
```
## Links

- **Repository**: [https://github.com/PberuKatwa/intent-flow-cli](https://github.com/PberuKatwa/intent-flow-cli)
- **Issues**: [https://github.com/PberuKatwa/intent-flow-cli/issues](https://github.com/PberuKatwa/intent-flow-cli/issues)
- **Natural NLP**: [https://github.com/NaturalNode/natural](https://github.com/NaturalNode/natural)

---

**Built using TypeScript, Natural NLP, and modern JavaScript**