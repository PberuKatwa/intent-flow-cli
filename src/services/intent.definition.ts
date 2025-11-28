import { IntentDefinition, IntentType } from "../types/intent.types";
import { logger } from "../utils/logger";

const allIntents:Array<IntentDefinition> = [

    {
        id:IntentType.MAKE_ORDER,
        label:`Make Order`,
        phrases:[
            
            "place an order",
            "make an order",
            "i want to order",
            "i would like to order",
            "buy flowers"
        ],
        tokens: [
            "order", "buy", "purchase", "send", "place", "checkout", "book", "reserve"
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
        ],
        tokens: [
            "track", "tracking", "status","rider", "where", "location", "arrive", "delivered", "delivery", "check", "update"
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
        ],
        tokens: [
            "pay", "payment", "price", "cost", "amount", "balance", "charge", "fee", "bill", "checkout", "due"
        ]
    }

]

export default allIntents;