import fs from "fs";
import path from "path";
import { IntentFileSchema } from "../validators/intent.schema";
import { IntentDefinition, IntentType } from "../types/intent.types";
import { logger } from "../utils/logger";

// remove duplicates, trim, lowercase
function normalizeArray(arr: string[]): string[] {
  return [...new Set(arr.map(v => v.trim().toLowerCase()))];
}

export function loadIntentsFromFile(filePath:string):IntentDefinition[]{
    try{

        if( !fs.existsSync( filePath ) ) throw new Error(`Intent File path doesnt exist`);

        if( !fs.statSync(filePath).isFile() ) throw new Error(`File path exists but no file was found`)

        const rawJson = fs.readFileSync( filePath, "utf-8" )
        const json = JSON.parse(rawJson)

        const parsed = IntentFileSchema.parse(json)
        logger.info(`Successfully parsed file`)

        const validatedOutput = parsed.intents.map(
            function(intent){

                const fileOutput:IntentDefinition = {
                    id:intent.id,
                    label:intent.label,
                    phrases:normalizeArray(intent.phrases),
                    strongTokens:normalizeArray(intent.strongTokens),
                    weakTokens:normalizeArray(intent.weakTokens)
                }

                return fileOutput
            }  
        )


        return validatedOutput

    }catch(error){

        throw error

    }
}