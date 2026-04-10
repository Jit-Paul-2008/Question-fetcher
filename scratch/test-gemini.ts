
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.chem1;
  const ai = new GoogleGenAI({ apiKey });
  
  // Try models with their full names if needed
  const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.5-flash-latest"];
  
  for (const m of modelsToTest) {
    try {
      console.log(`Testing ${m}...`);
      const result = await ai.models.generateContent({
        model: m,
        contents: [{ role: "user", parts: [{ text: "Hi" }] }]
      });
      console.log(`${m} worked!`);
      return;
    } catch (err) {
      console.error(`${m} failed:`, err.message);
    }
  }
}

testGemini();
