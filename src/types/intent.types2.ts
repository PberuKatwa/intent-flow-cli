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
    minScore?: number;      // Custom threshold (default: 4)
    priority?: number;      // Score multiplier (default: 1)
    canBeNegated?: boolean;
}

