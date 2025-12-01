export enum IntentType{
    UNKNOWN = 0,
    MAKE_ORDER = 1,
    TRACK_ORDER = 2,
    PAY_FOR_ORDER = 3,
}

export type IntentDefinition = {
    id:string;
    label:string;
    phrases:Array < string >;
    strongTokens:Array<string>
    weakTokens:Array<string>;
}

export type BestIntent = {
    id: string; 
    label: string;
    score: number; 
    matchedPhrase?:string;
    weakTokens?:Array<string>;
    strongTokens?:Array<string>;
    fuzzyTokens?:Array<string>;
}

