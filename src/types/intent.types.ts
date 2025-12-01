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
    strongTokens: readonly string[];
    weakTokens:readonly string[];
}

export type ReadOnlyIntentDefinition = Readonly<IntentDefinition>

export type BestIntent = {
    id: string; 
    label: string;
    score: number; 
    matchedPhrase?:string;
    partialPhrases?:Array<string>;
    weakTokens?:Array<string>;
    strongTokens?:Array<string>;
    fuzzyTokens?:Array<string>;
}

