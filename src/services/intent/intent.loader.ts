import fs from "fs";
import path from "path";
import { IntentFileSchema } from "../../validators/intent3.schema";
import { IntentDefinition } from "../../types/intent.types3";
import { logger } from "../../utils/logger";

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

    const validatedOutput = parsed.map(
      function(intent){

        const fileOutput:IntentDefinition = {
          id: intent.id,
          organization_type: intent.organization_type,
          description: intent.description,
          entity: intent.entity,
          category:intent.category,
          name: intent.name,
          organisation_tokens:normalizeArray(intent.organisation_tokens),
          phrase_tokens:normalizeArray(intent.phrase_tokens)
        }

        return fileOutput
      }
    )


    return validatedOutput

  }catch(error){
    throw error;
  }
}
