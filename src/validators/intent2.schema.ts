import { z } from "zod";

export const IntentSchema = z.object({
  id: z.number().int().positive(),
  organization_id: z.number().nullable(),
  organization_type: z.string().nullable(),
  organization_activity: z.string().nullable(),
  name: z.string().min(1),
  description: z.string().min(1),
  entity: z.string().nullable(),
  category: z.string().min(1),
  phrase_tokens: z.array(z.string().min(1)).min(1),
  action_tokens: z.array(z.string().min(1)),
  object_tokens: z.array(z.string().min(1)),
})

export const IntentFileSchema = z.object({
  intents: z.array(IntentSchema).min(1)
});

export type IntentValidation = z.infer<typeof IntentSchema>;
export type IntentFileType = z.infer<typeof IntentFileSchema>;
