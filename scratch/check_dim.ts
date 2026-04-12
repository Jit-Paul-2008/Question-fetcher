import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

async function checkDim() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: [{ parts: [{ text: "test" }] }]
    });
    console.log("Vector size for gemini-embedding-001:", response.embeddings?.[0]?.values?.length);
  } catch (err: any) {
    console.error("FAILED", err.message);
  }
}

checkDim();
