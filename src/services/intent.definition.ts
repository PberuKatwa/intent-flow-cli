import { IntentDefinition, IntentType } from "../types/intent.types";
import { logger } from "../utils/logger";

export function detectIntent( allIntents:Array<IntentDefinition>, message:string ){
    try{

        const text = message.toLowerCase().trim()

        for(const intent of allIntents){

            for(const phrase of intent.phrases){

                if( text.includes(phrase) ){
                    return{
                        intent:intent.id,
                        label:intent.label,
                        matchedPhrases:phrase
                    }
                }

            }

        }

        return{
            intent:IntentType.UNKNOWN,
            label:'UNKNOWN',
            phrase:'UNKNOWN'
        }

    }catch(error:any){

        logger.error(`Error in detecting intent`,{
            errorMessage:error.message,
            errorStack:error.stack
        })

    }

}