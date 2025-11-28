import * as readline from 'readline';
import path from "path";
import { logger } from './utils/logger'; // Assuming logger is available
import allIntents from './services/intent.definition'; // Assuming this imports an array of intent objects
import { detectIntent } from './services/intent.matcher'; // Assuming detectIntent is an asynchronous service
import { loadIntentsFromFile } from './services/intent.loader'

const defaultPath = path.join(__dirname,"files","default.json")

// --- Constants and Messages ---
const CLI_NAME = `INTENT FLOW CLI`;
const PROMPT_MESSAGE = `\nEnter your message > `;
const EXIT_COMMAND = 'exit';

// --- Main CLI Class ---
class CLI {

    private readonly rl: readline.Interface;

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            // Makes the prompt visible and keeps the interface active
            prompt: PROMPT_MESSAGE 
        });

        // Set up event listeners
        this.rl.on('line', this.handleInput.bind(this));
        this.rl.on('close', this.handleExit.bind(this));
    }

    /**
     * @function displayWelcome - Shows the welcome message and available intents.
     */
    public displayWelcome(): void {
        console.log(`\n\n================================`);
        console.log(`  WELCOME TO ${CLI_NAME}   `);
        console.log(`================================\n`);
        
        console.log(`\n-- Available Intents --`);
        allIntents.forEach(intent => {
            console.log(`  - ${intent.id}: ${intent.label}`);
        });

        console.log(`\n( Type "${EXIT_COMMAND}" or press Ctrl+C to quit )\n`);
        this.rl.prompt(); // Show the initial prompt
    }

    /**
     * @function handleInput - Processes the user's input line by line.
     */
    private async handleInput(input: string): Promise<void> {
        const message = input.trim();

        if (message.toLowerCase() === EXIT_COMMAND) {
            this.rl.close();
            return;
        }

        if (!message) {
            this.rl.prompt(); // Re-prompt if input is empty
            return;
        }

        try {

            const fullIntent = loadIntentsFromFile(defaultPath)
            // Processing user input with asynchronous intent detection
            const result =  detectIntent(fullIntent, message);

            console.log(`\n[RESULT] Intent Flow Detection:`);
            console.log(JSON.stringify(result, null, 2));
            console.log(`\n---------------------------------`);

        } catch (error: any) {
            // Robust error handling and feedback
            logger.error(`\n[ERROR] Failed to detect intent: ${error.message}`);
            if (error.stack) {
                console.error(error.stack);
            }
            console.log(`\n---------------------------------`);
        }
        
        this.rl.prompt(); // Show the prompt again after processing
    }

    /**
     * @function handleExit - Cleans up and exits the process.
     */
    private handleExit(): void {
        logger.info(`\n\nCLI EXITED. Session terminated.`); 
        process.exit(0);
    }

    /**
     * @function start - Starts the main CLI loop.
     */
    public start(): void {
        this.displayWelcome();
    }
}

// --- Start the CLI ---
const cli = new CLI();
cli.start();