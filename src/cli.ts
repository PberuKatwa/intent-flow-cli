import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { logger } from './utils/logger';
import { loadIntentsFromFile } from './services/intent.loader'
import CliClient from "./services/cli.client"

function startCli():void{
    try{
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const defaultPath = path.join(__dirname,"files","default.json")
        const cliName:string = `INTENT FLOW CLI`;
        const promptMessage:string = `\nEnter your message`;

        const intent = loadIntentsFromFile(defaultPath)
        const client = new CliClient( promptMessage ,cliName ,intent )

        return client.start()

    }catch(error:any){

        logger.error(`Error in starting cli`,{
            errorMessage:error.message,
            errorStack:error.stack
        })

    }

}

startCli()

