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
        this.registerListeners();
    }

    private close():void {
        try{
            console.log( chalk.blue(`\nSuccessfully shut down ${this.cliName}`) )
            this.rl.close()
            process.exit(0)
        }catch(error){
            throw error
        }
    }

    private registerListeners():void {
        try{

            this.rl.on("line", (input:string) => {

                const trimmed = input.trim();
                if( trimmed === "exit" ) return this.close();
                this.handleInput(trimmed)
                this.rl.prompt()

            })

            this.rl.on("SIGINT", () => { this.close(); });

        }catch(error){
            throw error
        }
    }

    private welcome():void {
        try{

            console.log( chalk.green(`\n\n================================`) );
            console.log(chalk.green(`  WELCOME TO ${this.cliName}  `));
            console.log(chalk.green(`================================\n`) );
            
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

    private handleInput(text:string){
        try{

            if(!text) return this.rl.prompt();

            const result = detectIntent( this.intents, text )
            console.log( chalk.bgCyanBright(`\n\n================================`) );
            console.log( chalk.bgCyanBright( `\n[RESULT] Intent Flow Detection:`) );
            console.log( chalk.bgCyanBright( `${JSON.stringify(result, null, 2)}` ) );
            console.log( chalk.bgCyanBright(`================================\n`) );

        }catch(error){
            throw error
        }
        this.rl.prompt()
    }

}

export default CLiCLient;