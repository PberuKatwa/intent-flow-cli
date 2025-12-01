import * as readline from 'readline';
import chalk from "chalk";

class CLiCLient{
    private readonly rl:readline.Interface;

    constructor(promptMessage:string){

        this.rl = readline.createInterface({
            input:process.stdin,
            output:process.stdout,
            prompt:promptMessage
        });

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