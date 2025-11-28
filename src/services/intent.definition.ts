import { IntentDefinition, IntentType } from "../types/intent.types";
import { logger } from "../utils/logger";

const allIntents:Array<IntentDefinition> = [

    {
        id:"MAKE_ORDER",
        label:`Make Order`,
        phrases:[
            
            "place an order",
            "make an order",
            "i want to order",
            "i would like to order",
            "buy flowers"
        ],
        strongTokens: [
            "order", "buy", "purchase", "send", "place", "checkout", "book", "reserve"
        ],
        weakTokens:[
            "want",
            "like",
            "need",
            "get",
            "give",
            "take",
            "flower",
            "flowers",
            "arrangement",
            "bouquet"
        ]
    },
    {
        id:"TRACK_ORDER",
        label:`Track Order`,
        phrases:[
            "where is my order",
            "track my order",
            "order status",
            "has my order arrived",
        ],
        strongTokens: [
            "track", "tracking", "status","rider", "where", "location", "arrive", "delivered", "delivery", "check", "update"
        ],
        weakTokens:[
            "my",
            "me",
            "find",
            "locate",
            "position",
            "when",
            "time",
            "coming",
            "soon",
            "package",
            "parcel"
        ]
    },
    {
        id:"PAY_FOR_ORDER",
        label:`Pay for order`,
        phrases:[
            "how much do i owe",
            "what do i need to pay",
            "payment due",
            "balance due",
        ],
        strongTokens: [
            "pay", "payment", "price", "cost", "amount", "balance", "charge", "fee", "bill", "checkout", "due"
        ],
        weakTokens:[
            "money",
            "cash",
            "card",
            "credit",
            "debit",
            "total",
            "sum",
            "owe",
            "debt",
            "outstanding",
            "pending"
        ]
    }

]

export default allIntents;