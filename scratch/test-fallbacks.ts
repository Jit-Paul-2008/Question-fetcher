
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const modelsToTry = [
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b"
  ];

  for (const model of modelsToTry) {
    try {
      console.log(`Testing model: ${model}...`);
      const res = await ai.models.generateContent({
        model: model,
        contents: { parts: [{ text: "Hi" }] }
      });
      console.log(`✅ Success with ${model}`);
    } catch (e) {
      console.log(`❌ Failed with ${model}: ${e.message}`);
    }
  }
}

main();
