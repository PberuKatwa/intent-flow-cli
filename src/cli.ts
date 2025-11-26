import * as readline from 'readline'

function startCli(){

}


// // CLI Interface
// function startCLI(): void {
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
//   });

//   console.log('=== NLP Intent Classifier ===');
//   console.log('Available intents:');
//   intentMap.forEach((intent, id) => {
//     if (id !== 4) {
//       console.log(`  ${id}. ${intent.name}`);
//     }
//   });
//   console.log('\nType your query (or "exit" to quit):\n');

//   rl.on('line', (input: string) => {
//     if (input.toLowerCase() === 'exit') {
//       console.log('Goodbye!');
//       rl.close();
//       return;
//     }

//     const intentId = classifyIntent(input);
//     const intent = intentMap.get(intentId);
    
//     console.log(`\n→ Input: "${input}"`);
//     console.log(`→ Classified Intent: ${intentId} (${intent?.name})\n`);
//   });

//   rl.on('close', () => {
//     process.exit(0);
//   });
// }
