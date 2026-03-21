import { GoogleGenAI } from '@google/genai';

class GeminiChatService {

  private readonly client: GoogleGenAI;
  private readonly prompt: string;

  constructor(
    apiKey: string,
    prompt:string
  ) {
    this.client = new GoogleGenAI({ apiKey }),
    this.prompt = prompt;
  }

  async basicPrompt(model: string = "gemini-2.5-flash"): Promise<string> {
    try {
      if (!this.prompt.trim()) {
        throw new Error("runPrompt: prompt cannot be empty");
      }

      const response = await this.client.models.generateContent({
        model,
        contents: [
          { role: "user", parts: [{ text: this.prompt }] }
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
}

export default GeminiChatService;
