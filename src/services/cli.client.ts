import * as readline from 'readline';
import chalk from "chalk";
import { detectIntent } from "./intent.matcher";
import { ReadOnlyIntentDefinition } from "../types/intent.types"

class CLiCLient{
    private readonly rl:readline.Interface;
    private readonly  cliName:string;
    private readonly intents:ReadOnlyIntentDefinition[];

    constructor( promptMessage:string, cliName:string, intents:ReadOnlyIntentDefinition[] ){

        this.rl = readline.createInterface({
            input:process.stdin,
            output:process.stdout,
            prompt:chalk.blue(`${promptMessage} ==>`)
        });

        this.cliName = cliName;
        this.intents = intents;
        // this.rl.on('line', this.handleInput.bind(this) )
    }

    private welcome(){
        try{

        }catch(error){
            throw error
        }
    }

    // handleInput(inputFunction){
    //     try{

    //     }catch(error){
    //         throw error
    //     }
    // }

}

export default CLiCLient;