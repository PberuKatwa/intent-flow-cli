import path from "path";
import { logger } from './utils/logger';
import { loadIntentsFromFile } from './services/intent.loader'
import CliClient from "./services/cli.client"

function startCli():void{
    try{

        const defaultPath = path.join(__dirname,"files","default.json")
        const cliName:string = `INTENT FLOW CLI`;
        const promptMessage:string = `\nEnter your message > `;



    }catch(error:any){

        logger.error(`Error in starting cli`,{
            errorMessage:error.message,
            errorStack:error.stack
        })

    }

}

