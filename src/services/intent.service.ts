import { IntentDefinition, IntentType } from "../types/intent.types";
import { logger } from "../utils/logger";

const intents:Array<IntentDefinition> = [

    {
        id:IntentType.MAKE_ORDER,
        label:`Make Order`,
        phrases:[
            
            "place an order",
            "make an order",
            "i want to order",
            "i would like to order",
            "buy flowers"
        ]
    },
    {
        id:IntentType.TRACK_ORDER,
        label:`Track Order`,
        phrases:[
            "where is my order",
            "track my order",
            "order status",
            "has my order arrived",
        ]
    },
    {
        id:IntentType.PAY_FOR_ORDER,
        label:`Pay for order`,
        phrases:[
            "how much do i owe",
            "what do i need to pay",
            "payment due",
            "balance due",
        ]
    }

]

export function detectIntent(message:string){
    try{

        const text = message.toLowerCase().trim()

        for (const intent of intents){

            for( const phrase of intent.phrases ){

                if( text.includes(phrase) ){

                    return{
                        intent:intent.id,
                        label:intent.label,
                        matchedPhrase:phrase
                    }

                }

            }


        }

        return {
            intent:IntentType.UNKNOWN,
            label:`unknown`,
            matchedPhrase:`None`
        }

    }catch(error:any){

        logger.error(`Error In detecting intent`, {
            errorMessage:error.message,
            errorStack:error.stack
        })

    }
}
