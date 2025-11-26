import { IntentDefinition, IntentType } from "../types/intent.types";
import { logger } from "../utils/logger";

export function detectIntent( intents:Array<IntentDefinition>, message:string ):{
    intent:number;
    label:string;
    matchedPhrase:string;
}{
    try{

        const text = message.toLowerCase().trim()

        for(const intent of intents){

            for(const phrase of intent.phrases){

                if( text.includes(phrase) ){
                    return{
                        intent:intent.id,
                        label:intent.label,
                        matchedPhrase:phrase
                    }
                }

            }

        }

        return{
            intent:IntentType.UNKNOWN,
            label:'UNKNOWN',
            matchedPhrase:'UNKNOWN'
        }

    }catch(error:any){

        logger.error(`Error in detecting intent`,{
            errorMessage:error.message,
            errorStack:error.stack
        })

        return {
            intent: IntentType.UNKNOWN,
            label: 'UNKNOWN',
            matchedPhrase: 'UNKNOWN',
        };

    }

}