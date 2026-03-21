import { z } from "zod";

export const BestIntentSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  description: z.string().min(1),
  userMessage: z.string(),
  entity: z.string().min(1),
  score: z.number().min(0).max(1),

  phrase_tokens: z.array(z.string()).optional(),
  organisation_tokens: z.array(z.string()).optional(),
});

export type BestIntent = z.infer<typeof BestIntentSchema>;
