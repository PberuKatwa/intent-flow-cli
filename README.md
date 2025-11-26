# Intent Detection Engine

A lightweight, pattern-based NLP intent classification engine for Node.js and TypeScript. Classify user input into predefined intents using regex patterns and token matching without external API dependencies.

## Overview

This CLI tool analyzes natural language text and returns structured intent classifications with confidence scores. It uses a hybrid approach combining phrase-level regex matching with token-based scoring to achieve accurate intent detection for common use cases like order management, customer service routing, and conversational interfaces.

## Features

- **Hybrid Matching**: Combines phrase regex patterns (high weight) with individual token matching (lower weight)
- **Confidence Scoring**: Configurable thresholds ensure reliable classification with margin validation
- **Stemming Support**: Basic stemming improves token matching across word variations
- **Zero Dependencies**: No external NLP APIs or trained models required
- **Extensible**: Easy to add new intents, patterns, and tokens through simple configuration
- **Detailed Output**: Returns intent ID, label, confidence score, and matched patterns/tokens
- **Ambiguity Handling**: Returns "unknown" intent when confidence is insufficient

## Installation

```bash
npm install -g intent-flow-cli
```

Or for local development:

```bash
git clone https://github.com/yourusername/intent-flow-cli.git
cd intent-flow-cli
npm install
npm run build
```

## Usage

### CLI

```bash
# Basic usage
intent-flow "where is my order"

# Output:
# Intent: track (ID: 2)
# Score: 6
# Matched phrases: where is my order
# Matched tokens: where, order

# Check multiple inputs
intent-flow "I want to buy flowers"
intent-flow "how much do I owe"
intent-flow "hello there"  # Returns unknown
```

### Programmatic Usage

```typescript
import { detectIntent, IntentType } from './services/intent.service';

const result = detectIntent("where is my order");

console.log(result);
// {
//   intent: 2,
//   label: "track",
//   score: 6,
//   details: {
//     phrases: ["where is my order"],
//     tokens: ["track", "where", "order"]
//   }
// }

if (result.intent === IntentType.TRACK) {
  // Handle order tracking
}
```

## Intent Types

The default configuration includes:

- **MAKE** (1): Order creation, purchasing, booking
- **TRACK** (2): Order status, delivery tracking, location queries
- **PAY** (3): Payment processing, pricing, billing
- **UNKNOWN** (0): Fallback for unclassified input

## Configuration

### Adding New Intents

Edit the `INTENTS` array in `services/intent.service.ts`:

```typescript
{
  id: IntentType.CANCEL,
  label: "cancel",
  phraseRegexes: [
    /\b(cancel my order|cancel order)\b/,
    /\b(i want to cancel)\b/,
  ],
  tokens: [
    "cancel",
    "stop",
    "refund",
    "undo",
  ],
}
```

### Tuning Parameters

Adjust these constants in `intent.service.ts`:

```typescript
const PHRASE_WEIGHT = 3;           // Weight for phrase regex matches
const TOKEN_WEIGHT = 1;            // Weight for individual token matches
const TOKEN_MULTI_HIT_BONUS = 1;   // Bonus for multiple token matches
const MIN_CONFIDENCE = 3;          // Minimum score to accept intent
const MIN_MARGIN = 2;              // Required score difference from runner-up
```

## How It Works

1. **Normalization**: Input text is lowercased, stripped of special characters, and whitespace-normalized
2. **Stemming**: Words are stemmed to remove common endings (ing, ed, ly, es, s)
3. **Phrase Matching**: Regex patterns are tested against normalized input (weight: 3 per match)
4. **Token Matching**: Individual tokens are matched against stemmed words (weight: 1 per match)
5. **Multi-Token Bonus**: Extra point awarded when 2+ distinct tokens match
6. **Validation**: Top intent must meet minimum confidence and beat runner-up by minimum margin
7. **Result**: Returns intent ID, label, score, and matched patterns/tokens

## Examples

| Input | Detected Intent | Score | Reasoning |
|-------|----------------|-------|-----------|
| "where is my order" | TRACK | 6 | Phrase match + tokens |
| "I want to buy flowers" | MAKE | 4 | Phrase match + token |
| "how much do I owe" | PAY | 3 | Phrase match |
| "hello" | UNKNOWN | 0 | No matches |
| "order flowers for delivery" | MAKE | 5 | Multiple token matches + bonus |

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run locally
npm start "your test message"

# Watch mode
npm run dev
```

## Project Structure

```
intent-flow-cli/
├── src/
│   ├── services/
│   │   └── intent.service.ts    # Core intent detection logic
│   ├── cli.ts                    # CLI entry point
│   └── index.ts                  # Programmatic API export
├── tests/
│   └── intent.service.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Testing

The engine includes a test suite covering:

- Phrase regex matching
- Token-based matching
- Confidence thresholds
- Margin validation
- Ambiguous input handling
- Edge cases

```bash
npm test
```

## Use Cases

- Customer service chatbots
- Order management systems
- Voice assistant command routing
- Form intent classification
- FAQ routing
- Support ticket categorization
- Conversational UI navigation

## Limitations

- Pattern-based approach requires manual rule configuration
- Does not handle complex semantic understanding
- Limited to predefined intent categories
- Basic stemming may miss some word variations
- No context awareness across multiple messages

## Extending the Engine

### Adding Synonyms

Expand token arrays with domain-specific vocabulary:

```typescript
tokens: [
  "track",
  "locate",    // synonym
  "find",      // synonym
  "monitor",   // synonym
]
```

### Domain Adaptation

Replace the default e-commerce intents with your domain:

```typescript
// Customer support domain
IntentType.TECHNICAL_ISSUE
IntentType.BILLING_QUESTION
IntentType.FEATURE_REQUEST
IntentType.ACCOUNT_MANAGEMENT
```

### Multi-Language Support

Create separate intent definitions per language or use translation preprocessing.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Author

Your Name / Organization

## Acknowledgments

Built with TypeScript and Node.js for fast, reliable intent classification without external dependencies.

## Support

- Issues: GitHub Issues
- Discussions: GitHub Discussions
- Documentation: See docs/ folder

## Roadmap

- Multi-language support
- Confidence calibration tools
- Intent definition validator
- Performance benchmarks
- Training data export for ML transition
- REST API wrapper
- Docker container
- Interactive tuning interface