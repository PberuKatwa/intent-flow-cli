import { GoogleGenAI } from '@google/genai';
import { BestIntent } from '../types/intent.types3';
import { BestIntentSchema } from '../validators/bestIntent.schema';
import { logger } from '../utils/logger';

class GeminiChatService {

  private readonly client: GoogleGenAI;

  constructor(
    apiKey: string
  ) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async basicPrompt(prompt: string, model: string = "gemini-2.5-flash"): Promise<string> {
    try {
      if (!prompt.trim()) {
        throw new Error("runPrompt: prompt cannot be empty");
      }

      logger.warn(`Attempting to use gemini to detect intent`);

      const response = await this.client.models.generateContent({
        model,
        contents: [
          { role: "user", parts: [{ text: prompt }] }
        ],
      });

      const output = response.text;

      if (!output) {
          throw new Error("GeminiChatService: No text response from the model");
      }

      return output;
    } catch (err: any) {
      throw new Error(`GeminiChatService Error: ${err.message}`);
    }
  }

  public async getLlmIntent(prompt: string): Promise<BestIntent> {
    try {
      const rawResponse = await this.basicPrompt(prompt);

      const cleanJson = rawResponse.replace(/```json|```/g, "").trim();
      const jsonObject = JSON.parse(cleanJson);

      const validatedResponse = BestIntentSchema.parse(jsonObject);

      logger.info(`Successfully validated ai response`);

      return validatedResponse;
    } catch (error: any) {
      logger.error(`Validation/Parsing Error: ${error.message}`);
      throw error;
    }
  }
}

export default GeminiChatService;
