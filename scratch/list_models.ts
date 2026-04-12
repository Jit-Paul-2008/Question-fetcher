import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  try {
    // There is no direct listModels in the standard GoogleGenerativeAI SDK for Node
    // It's usually through the REST API or we have to guess.
    // However, I can try 'embedding-001' again but with 'v1' instead of 'v1beta' if possible,
    // although the SDK defaults to v1beta.
    
    // Let's try 'models/text-embedding-004' explicitly.
    const model = genAI.getGenerativeModel({ model: "models/text-embedding-004" });
    const result = await model.embedContent("test");
    console.log("SUCCESS with models/text-embedding-004", result.embedding.values.length);
  } catch (err: any) {
    console.error("FAILED with models/text-embedding-004", err.message);
  }
}

listModels();
