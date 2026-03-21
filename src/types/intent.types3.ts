export type IntentDefinition = {
  id: number;
  organization_type: string | null;

  name: string;
  description: string;

  entity: string | null;
  category: string;

  organisation_tokens: string[];
  phrase_tokens: string[];
};

export type ReadOnlyIntentDefinition = Readonly<IntentDefinition>;

export type BestIntent = {
  id: number;
  name: string;
  score: number;

  phrase_tokens?: string[];
  organisation_tokens?: string[];
  fuzzy_tokens?: string[];
};
