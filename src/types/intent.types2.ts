export type IntentDefinition = {
  id: number;

  organization_id: number | null;
  organization_type: string | null;
  organization_activity: string | null;

  name: string;
  description: string;

  entity: string | null;
  category: string;

  phrase_tokens: string[];

  action_tokens: readonly string[];
  object_tokens: readonly string[];
};

export type ReadOnlyIntentDefinition = Readonly<IntentDefinition>;

export type BestIntent = {
  id: number;
  name: string;
  score: number;

  matchedPhrase?: string;

  partialPhrases?: string[];

  actionTokens?: string[];
  objectTokens?: string[];

  fuzzyTokens?: string[];
};
