import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

async function testNewSDKEmbedding() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    // Attempting embedding with the NEW SDK
    const response = await ai.models.embedContent({
      model: "text-embedding-004", // This is the modern 768-dim model
      contents: [{ parts: [{ text: "test" }] }]
    });
    console.log("SUCCESS with new SDK and text-embedding-004", response.embeddings?.[0]?.values?.length);
  } catch (err: any) {
    console.error("FAILED with new SDK and text-embedding-004", err.message);
    
    try {
      // Trying the older model but in the new SDK
      const response = await ai.models.embedContent({
        model: "embedding-001",
        contents: [{ parts: [{ text: "test" }] }]
      });
      console.log("SUCCESS with new SDK and embedding-001", response.embeddings?.[0]?.values?.length);
    } catch (err2: any) {
      console.error("FAILED with new SDK and embedding-001", err2.message);
    }
  }
}

testNewSDKEmbedding();
