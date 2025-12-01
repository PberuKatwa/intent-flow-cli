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

            console.log( chalk.green(`\n\n================================`) );
            console.log(chalk.green(`  WELCOME TO ${this.cliName}  `));
            console.log(chalk.green`================================\n`);
            
            console.log( chalk.bgGreen(`\n-- Available Intents --`) )
            this.intents.forEach(
                function(intent){
                    return console.log( chalk.bgGreen( `  - ${intent.id}: ${intent.label}` ) )
                }
            )
            console.log( chalk.bgGreen( `\n( Type "exit" or press Ctrl+C to quit )\n` ) );
            this.rl.prompt();

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