
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

async function testFuture() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.chem1;
  const ai = new GoogleGenAI({ apiKey });
  
  const models = ["gemini-2.0-flash-001", "gemini-2.5-flash", "gemini-1.5-flash"];
  
  for (const m of models) {
    try {
      console.log(`Testing ${m}...`);
      const result = await ai.models.generateContent({
        model: m,
        contents: [{ role: "user", parts: [{ text: "Hi" }] }]
      });
      console.log(`${m} success! Response: ${result.text}`);
      return;
    } catch (err) {
      console.error(`${m} failed: ${err.message}`);
    }
  }
}

testFuture();
