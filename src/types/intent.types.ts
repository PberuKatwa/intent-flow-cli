export enum IntentType{
    UNKNOWN = 0,
    MAKE_ORDER = 1,
    TRACK_ORDER = 2,
    PAY_FOR_ORDER = 3,
}

export type IntentDefinition = {
    id:IntentType;
    label:string;
    phrases:Array < string >;
    strongTokens:Array<string>
    weakTokens:Array<string>;
}

