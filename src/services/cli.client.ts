import * as readline from 'readline';

class CLiCLient{
    private readonly rl:readline.Interface;

    constructor(promptMessage:string){

        this.rl = readline.createInterface({
            input:process.stdin,
            output:process.stdout,
            prompt:promptMessage
        })
        
    }

}

export default CLiCLient;