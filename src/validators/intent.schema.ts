import { z } from "zod"

export const IntentSchema = z.object({
    id:z.string().min(1),
    label:z.string().min(1),
    phrases:z.array( z.string() ).min(1),
    strongTokens:z.array( z.string() ).min(1),
    weakTokens:z.array( z.string() ).min(1)
})

export const IntentFileSchema = z.object({
    intents:z.array( IntentSchema )
})

export type  IntentFileType = z.infer< typeof IntentFileSchema>
export type IntentValidation = z.infer<typeof IntentSchema>