import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { IntentFileSchema } from '../validators/intent3.schema';
import { logger } from './logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INTENT_FILE_PATH = path.join(__dirname, "..", "files", "intent3.json");

export function addOrganisationToken(
  targetId: number,
  newToken: string
): void {
  try {
    if (!fs.existsSync(INTENT_FILE_PATH)) {
      throw new Error(`Intent File not found at: ${INTENT_FILE_PATH}`);
    }

    const rawJson = fs.readFileSync(INTENT_FILE_PATH, "utf-8");
    const json = JSON.parse(rawJson);

    const intents = IntentFileSchema.parse(json);

    const updatedIntents = intents.map((intent) => {
      if (intent.id === targetId) {
        if (intent.organisation_tokens.includes(newToken)) {
          console.log("Token already exists. Skipping update.");
          return intent;
        }

        return {
          ...intent,
          organisation_tokens: [newToken, ...intent.organisation_tokens],
        };
      }
      return intent;
    });

    fs.writeFileSync(
      INTENT_FILE_PATH,
      JSON.stringify(updatedIntents, null, 2),
      "utf-8"
    );

    logger.info(`Successfully updated: ${INTENT_FILE_PATH}`);

  } catch (error) {
    console.error(`Failed to update intents: ${error instanceof Error ? error.message : error}`);
    throw error;
  }
}
