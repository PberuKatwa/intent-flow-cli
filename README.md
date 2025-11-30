# Intent Flow CLI

A powerful, flexible command-line tool for detecting user intent from natural language text. Intent Flow CLI uses advanced NLP techniques including tokenization, stemming, phrase matching, and fuzzy matching to accurately classify user messages into predefined intents.

## Features

- **Multi-layered Intent Matching**: Combines exact phrase matching, strong/weak token scoring, and fuzzy matching for robust intent detection
- **Configurable Intent Definitions**: Easy-to-define intents with phrases, strong tokens, and weak tokens
- **Smart Tokenization**: Porter Stemmer algorithm with stop word filtering for accurate text processing
- **Interactive CLI**: Real-time intent detection with detailed match reporting
- **Extensible Architecture**: Load custom intent definitions from JSON files

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Intent Definition](#intent-definition)
- [Configuration](#configuration)
- [Scoring System](#scoring-system)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Contributing](#contributing)

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/intent-flow-cli.git

# Navigate to project directory
cd intent-flow-cli

# Install dependencies
npm install

# Build the project
npm run build

# Run the CLI
npm start
```

### Dependencies

- `natural`: NLP library for stemming and string distance calculations
- `typescript`: Type-safe JavaScript development
- `readline`: Node.js native module for CLI interactions

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

### 1. Tokenization

The tokenizer cleans, normalizes, and stems input text:

```typescript
Input: "I want to order flowers"
→ Original Tokens: ["i", "want", "to", "order", "flowers"]
→ Stemmed Tokens: ["want", "order", "flower"] // Stop words removed
```

**Features:**
- Lowercase normalization
- Punctuation removal
- Stop word filtering (the, a, an, is, are, etc.)
- Porter Stemmer algorithm for word stemming

### 2. Intent Matching

The matcher scores each intent definition against the input using multiple strategies:

#### Phrase Matching (Highest Priority)
- Compares input against predefined phrases
- Uses normalized Jaccard similarity
- **Exact match**: Returns immediately with score 10
- **Partial match**: Applies score with partial multiplier

#### Strong Token Matching
- Matches against high-confidence keywords
- **Exact match**: +3 points
- **Fuzzy match** (Levenshtein distance ≤ 1): +1.5 points

#### Weak Token Matching
- Matches against supporting keywords
- **Exact match**: +1 point

### 3. Result Determination

```typescript
{
  bestIntent: {
    id: "MAKE_ORDER",
    label: "Make Order",
    score: 8.5,
    matchedPhrase: null
  },
  matchedStrongTokens: ["order"],
  matchedWeakTokens: ["want", "flower"],
  matchedFuzzyTokens: []
}
```

Returns `UNKNOWN` if score < 4 (minimum threshold).

## Intent Definition

Intents are defined using the `IntentDefinition` interface:

```typescript
{
  id: "MAKE_ORDER",           // Unique identifier
  label: "Make Order",         // Human-readable label
  
  phrases: [                   // Exact or partial phrase matches
    "place an order",
    "make an order",
    "i want to order"
  ],
  
  strongTokens: [              // High-confidence keywords
    "order", "buy", "purchase", "send"
  ],
  
  weakTokens: [                // Supporting keywords
    "want", "like", "need", "flower"
  ]
}
```

### Built-in Intents

The CLI comes with three example intents:

| Intent ID | Purpose | Example Phrases |
|-----------|---------|-----------------|
| `MAKE_ORDER` | User wants to purchase | "I want to order flowers", "buy arrangement" |
| `TRACK_ORDER` | User checking delivery status | "where is my order", "track package" |
| `PAY_FOR_ORDER` | User inquiring about payment | "how much do I owe", "what's the balance" |

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
      "i want to cancel"
    ],
    "strongTokens": ["cancel", "stop", "abort"],
    "weakTokens": ["order", "purchase", "don't"]
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

Modify the scoring constants in `intent.matcher.ts`:

```typescript
const SCORES = {
  EXACT_PHRASE: 10,              // Full phrase match
  STRONG_TOKEN: 3,               // Strong keyword match
  WEAK_TOKEN: 1,                 // Weak keyword match
  FUZZY_MATCH: 1.5,              // Fuzzy string match
  MIN_THRESHOLD: 4,              // Minimum score for detection
  PARTIAL_PHRASE_MULTIPLIER: 0.5 // Multiplier for partial phrases
};
```

## Scoring System

### Score Calculation Example

**Input**: "I need to buy flowers"

**Processing**:
1. Tokenize → `["need", "buy", "flower"]`
2. Check phrases:
   - "buy flowers" → 2/2 tokens match in phrase "buy flowers" → +10 points
3. Return immediately with `MAKE_ORDER` (exact phrase match)

**Alternative Input**: "want to get some flowers"

1. Tokenize → `["want", "get", "flower"]`
2. Check phrases → No exact matches
3. Strong tokens:
   - "get" ≈ "buy" (distance=2) → No score
4. Weak tokens:
   - "want" → +1
   - "flower" → +1
5. **Total**: 2 points → Below threshold → `UNKNOWN`

## API Reference

### `tokenize(text: string): TokenizedOutput`

Tokenizes and stems input text.

```typescript
const result = tokenize("I want to order");
// {
//   originalTokens: ["i", "want", "to", "order"],
//   stemmedTokens: ["want", "order"]
// }
```

### `detectIntent(intents: IntentDefinition[], message: string)`

Detects the best matching intent for a message.

```typescript
const result = detectIntent(allIntents, "track my order");
// {
//   bestIntent: {
//     id: "TRACK_ORDER",
//     label: "Track Order",
//     score: 10,
//     matchedPhrase: "track my order"
//   },
//   matchedStrongTokens: ["track"],
//   matchedWeakTokens: ["my"],
//   matchedFuzzyTokens: []
// }
```

### `loadIntentsFromFile(filePath: string): IntentDefinition[]`

Loads intent definitions from a JSON file.

```typescript
const intents = loadIntentsFromFile('./intents/custom.json');
```

## Examples

### Example 1: E-commerce Bot

```typescript
const ecommerceIntents = [
  {
    id: "ADD_TO_CART",
    label: "Add to Cart",
    phrases: ["add to cart", "put in basket"],
    strongTokens: ["add", "cart", "basket"],
    weakTokens: ["want", "like", "this"]
  },
  {
    id: "CHECK_PRICE",
    label: "Check Price",
    phrases: ["how much", "what's the price"],
    strongTokens: ["price", "cost", "much"],
    weakTokens: ["how", "what", "tell"]
  }
];

detectIntent(ecommerceIntents, "add this to my cart");
// Returns: ADD_TO_CART
```

### Example 2: Customer Support Bot

```typescript
const supportIntents = [
  {
    id: "REPORT_BUG",
    label: "Report Bug",
    phrases: ["report a bug", "something is broken"],
    strongTokens: ["bug", "broken", "error", "issue"],
    weakTokens: ["report", "problem", "not", "working"]
  }
];
```

## Project Structure

```
intent-flow-cli/
├── src/
│   ├── services/
│   │   ├── intent.definition.ts    # Intent definitions
│   │   ├── intent.tokenizer.ts    # Tokenization logic
│   │   ├── intent.matcher.ts      # Intent matching algorithm
│   │   └── intent.loader.ts       # Load intents from files
│   ├── types/
│   │   └── intent.types.ts        # TypeScript interfaces
│   ├── utils/
│   │   └── logger.ts              # Logging utilities
│   ├── files/
│   │   └── default.json           # Default intent definitions
│   └── index.ts                   # CLI entry point
├── package.json
├── tsconfig.json
└── README.md
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
- Add tests for new features
- Follow existing code style
- Update README for significant changes

Built using TypeScript and Natural NLP