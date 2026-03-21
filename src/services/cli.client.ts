import * as readline from 'readline';
import chalk from "chalk";
import { ReadOnlyIntentDefinition } from "../types/intent.types.js"
import { IntentDetectorService } from './intent/intent.matcher.js';
import GeminiChatService from './gemini.service.js';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'i', 'you', 'it','for',
  'my'
]);

const geminiKey = process.env.GEMINI_TOKEN ? process.env.GEMINI_TOKEN : "";
const geminiService = new GeminiChatService(geminiKey)


class CLiClient {
    private readonly rl: readline.Interface;
    private readonly cliName: string;
    private readonly intents: ReadOnlyIntentDefinition[];

    constructor(promptMessage: string, cliName: string, intents: ReadOnlyIntentDefinition[]) {

      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk.cyan.bold(`${promptMessage} ❯ `)
      });

      this.cliName = cliName;
      this.intents = intents;

      this.registerListeners();
    }

    private close(): void {
      console.log(chalk.yellow('\n╭─────────────────────────────────────╮'));
      console.log(chalk.yellow('│ ') + chalk.white('Shutting down gracefully... 👋     ') + chalk.yellow('│'));
      console.log(chalk.yellow('╰─────────────────────────────────────╯'));
      console.log(chalk.dim(`  Thanks for using ${chalk.cyan.bold(this.cliName)}!\n`));

      this.rl.close();
      process.exit(0);
    }

    private registerListeners(): void {

      this.rl.on("line", (input: string) => {
        const trimmed = input.trim();

        if (trimmed === "exit") return this.close();

        this.handleInput(trimmed);
        this.rl.prompt();
      });

      this.rl.on("SIGINT", () => this.close());
    }

    private displayWelcome(): void {

        console.clear();

        console.log(chalk.magenta.bold('\n╔═══════════════════════════════════════════════╗'));
        console.log(chalk.magenta.bold('║') + chalk.cyan.bold('                                               ') + chalk.magenta.bold('║'));
        console.log(
            chalk.magenta.bold('║') +
            chalk.cyan.bold('     🚀  ') +
            chalk.white.bold(this.cliName.padEnd(32)) +
            chalk.cyan.bold('  🚀     ') +
            chalk.magenta.bold('║')
        );
        console.log(chalk.magenta.bold('║') + chalk.dim('   Pattern-based NLP Intent Classifier        ') + chalk.magenta.bold('║'));
        console.log(chalk.magenta.bold('║') + chalk.cyan.bold('                                               ') + chalk.magenta.bold('║'));
        console.log(chalk.magenta.bold('╚═══════════════════════════════════════════════╝\n'));

        console.log(chalk.yellow.bold('  ⚡ Available Intents') + chalk.dim(` (${this.intents.length} loaded)\n`));
        console.log(chalk.dim('  ┌────────────────────────────────────────────┐'));

        this.intents.forEach((intent, index) => {
            const num = chalk.yellow(`${index + 1}.`.padStart(4));

            console.log(
                chalk.dim('  │ ') +
                num + ' ' +
                chalk.cyan.bold(intent.name.padEnd(25)) +  // ✅ FIXED
                chalk.gray('→ ') +
                chalk.white(intent.description)            // ✅ BETTER FIELD
            );
        });

        console.log(chalk.dim('  └────────────────────────────────────────────┘\n'));
        console.log(chalk.dim('  💡 Type ') + chalk.cyan.bold('exit') + chalk.dim(' or press Ctrl+C to quit\n'));
        console.log(chalk.gray('─'.repeat(50)) + '\n');

        this.rl.prompt();
    }

    private async handleInput(text: string): Promise<void> {

      if (!text) return;

      const intentDetector = new IntentDetectorService(this.intents, STOP_WORDS, geminiService);

      const result = await intentDetector.getFinalIntent(text);

      console.log(chalk.green('\n  ╭───────────────────────────────────────────────╮'));
      console.log(chalk.green('  │ ') + chalk.bold('🎯 Intent Detection Result') + '                   ' + chalk.green('│'));
      console.log(chalk.green('  ╰───────────────────────────────────────────────╯\n'));

      console.log(chalk.dim(`    Intent: ${chalk.cyan.bold(result.name)} (${result.id})`));
      console.log(chalk.dim(`    Score:  ${chalk.yellow(result.score.toString())}\n`));

      console.log(chalk.dim('    Full Response:'));
      console.log(chalk.dim('    ┌──────────────────────────────────────────'));

      const jsonStr = JSON.stringify(result, null, 2);
      jsonStr.split('\n').forEach(line => {
          console.log(chalk.dim('    │ ') + chalk.cyan(line));
      });

      console.log(chalk.dim('    └──────────────────────────────────────────\n'));
    }

    public start(): void {
      this.displayWelcome();
    }
}

export default CLiClient;
