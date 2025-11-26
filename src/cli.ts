import * as readline from 'readline'
import { logger } from './utils/logger'
import allIntents from './services/intent.definition'
import { detectIntent } from './services/intent.service'

function startCli():void{

    const rl = readline.createInterface({
        input:process.stdin,
        output:process.stdout
    })

    logger.info(`=== WELCOME TO INTENT FLOW CLI ===`)
    console.log(`Available intents:`)

    allIntents.map(
        function(intent){
            return console.log(`${intent.id}:${intent.label}`)
        }
    )

    console.log(`\nEnter text to get intent ( or "exit" or  ctrl +c to quit)`)

    rl.on( 'line', function (input:string) {

        const message = input.trim()

        if( message.toLowerCase() === 'exit' ){
            console.log(`CLI EXITED!!`); 
            rl.close(); 
            return;
        } 

        const result = detectIntent( allIntents, message )

        console.log(`Intent Flow Result:`, JSON.stringify(result, null, 2) ) 

        rl.on('close', () => {
            process.exit(0);
        });

    })

}

startCli()

