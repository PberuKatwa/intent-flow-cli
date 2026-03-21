
export function buildIntentPrompt(
  userMessage: string,
  organisationContext = ""
): string {
  const orgBlock = organisationContext.trim()
    ? `
    -----------------------
    🏢 ORGANISATION CONTEXT (use this to calibrate token matching)
    -----------------------
    ${organisationContext.trim()}
    `
    : `
    -----------------------
    🏢 ORGANISATION CONTEXT
    -----------------------
    Purple Hearts is a premium flower delivery service. Customers browse bouquets,
    place orders, track deliveries, and make payments (primarily via M-Pesa).
    `;

  return `
    You are the AI Intent Classifier for Purple Hearts, a premium flower delivery service.

    Your goal is to:
    1. Read the customer message below.
    2. Correct ONLY genuine spelling mistakes or clear grammatical errors before
      classification. Do NOT rephrase, expand, summarise, or change the meaning.
      If the message is so garbled it cannot reasonably be understood, treat it
      as UNKNOWN.
    3. Map the corrected message to exactly ONE of the 12 intents listed below.
    4. Return a single JSON object matching the BestIntent interface — nothing else.
    ${orgBlock}
    -----------------------
    🎯 AVAILABLE INTENTS
    -----------------------

    ID  NAME                ENTITY         DESCRIPTION
    ──  ──────────────────  ─────────────  ──────────────────────────────────────────────────────────────
    1   GET_ALL_PRODUCTS    Products       User wants to browse or view all available flowers / bouquets.
    2   GET_PRODUCT         Products       User wants details on one specific product, flower, or bouquet.
    3   GET_ALL_ORDERS      Orders         User wants to view or list all their past or current orders.
    4   GET_ORDER           Orders         User wants a specific order or invoice by ID / reference.
    5   CREATE_ORDER        Orders         User wants to place, create, or finalise a new order.
    6   GET_ORDER_STATUS    Orders         User wants to track or check the delivery status of an order.
    7   CREATE_PAYMENT      Payments       User wants to pay or checkout for an order.
    8   GET_ALL_PAYMENTS    Payments       User wants to view all their past payments / transactions.
    9   GET_PAYMENT         Payments       User wants a specific payment record or receipt.
    10  GREETING            CustomerCare   User is initiating a conversation or exchanging pleasantries.
    11  HELP                CustomerCare   User needs guidance, is confused, or wants to know what to do.
    12  COMPLAINT           CustomerCare   User is expressing dissatisfaction or reporting a problem.

    -----------------------
    📦 OUTPUT FORMAT (MANDATORY — valid JSON only, no markdown, no extra text)
    -----------------------

    {
      "id": <integer 1–12, or 0 for UNKNOWN>,
      "name": "<intent name from the table above, or "UNKNOWN">",
      "description": "<one-sentence description of the matched intent, copied from the table above>",
      "userMessage": "<the customer message — corrected ONLY if it contained spelling or grammar errors; otherwise identical to the raw input>",
      "entity": "<Products | Orders | Payments | CustomerCare | Unknown>",
      "score": <float 0.0–1.0 representing confidence>,
      "phrase_tokens": ["<key phrases from the message that triggered this intent>"],
      "organisation_tokens": ["<organisation-specific phrases from the message, if any>"]
    }

    -----------------------
    📝 CORRECTION RULES (CRITICAL — follow precisely)
    -----------------------

    • Fix clear misspellings: "ordeer" → "order", "flwers" → "flowers".
    • Fix obvious grammatical errors: "I wants to buy" → "I want to buy".
    • Do NOT add, remove, or reorder words beyond what correction requires.
    • Do NOT expand abbreviations or slang unless they are unambiguously wrong.
    • Preserve the customer's intent and tone exactly.
    • If the corrected message still cannot be mapped to an intent, return UNKNOWN.

    -----------------------
    ❌ UNKNOWN FALLBACK
    -----------------------

    If the message is gibberish, completely off-topic, or cannot reasonably be
    mapped to any of the 12 intents — even after correction — return:

    {
      "id": 0,
      "name": "UNKNOWN",
      "description": "The message could not be mapped to any known intent.",
      "userMessage": "<raw input unchanged>",
      "entity": "Unknown",
      "score": 0.0,
      "phrase_tokens": [],
      "organisation_tokens": []
    }

    NOTE: Simple greetings like "hi" or "hey" must map to GREETING (id 10), never UNKNOWN.

    -----------------------
    ==> CUSTOMER MESSAGE: ${userMessage}
    -----------------------
    `.trim();

}
