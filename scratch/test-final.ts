
import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";

async function testFinal() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.chem1;
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    console.log("Testing Gemini 1.5 Flash with Schema...");
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: "Extract topic from: 'Introduction to organic chemistry'" }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topicDetected: { type: Type.STRING },
            summary: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            searchQueries: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["topicDetected", "summary", "keywords", "searchQueries"],
        },
      },
    });
    console.log("SUCCESS:", result.text);
  } catch (err) {
    console.error("FAILURE:", err.message);
  }
}

testFinal();
