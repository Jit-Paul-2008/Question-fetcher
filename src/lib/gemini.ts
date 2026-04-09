import { GoogleGenAI, Type } from "@google/genai";
import { tavily } from "@tavily/core";

const getApiKey = (name: string) => {
  const key = process.env[name];
  if (!key) {
    throw new Error(`API Key not found. Please add '${name}' in the Secrets panel.`);
  }
  return key;
};

export interface Question {
  text: string;
  options: string[];
  answer: string;
  source: string;
  year: string;
  type: "Official Question Bank" | "PYQ" | "HOTS" | "Practice";
  topic: string;
}

export interface ScanResult {
  keywords: string[];
  topicDetected: string;
  summary: string;
  questions: Question[];
}

export async function scanChemistryNote(
  imageData: string,
  userTopic: string,
  exams: string[]
): Promise<ScanResult> {
  const geminiKey = process.env.chem1 || process.env.GEMINI_API_KEY || getApiKey("GEMINI_API_KEY");
  const tavilyKey = process.env.TAVILY_API_KEY || process.env.TRAVILY_API_KEY || getApiKey("TAVILY_API_KEY");
  
  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const tv = tavily({ apiKey: tavilyKey });
  const model = "gemini-3-flash-preview";

  // Step 1: Analyze image and generate search query
  const analysisPrompt = `
    Analyze this chemistry note. 
    1. Extract key keywords and formulas.
    2. Identify the specific sub-topic (using "${userTopic}" as a guide).
    3. Formulate a highly specific search query to find real exam questions (PYQs, HOTS) for ${exams.join(", ")} on this topic.
    
    Return JSON:
    {
      "keywords": ["kw1", "kw2"],
      "topicDetected": "Topic Name",
      "summary": "Brief summary",
      "searchQuery": "Specific search query for exam questions"
    }
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageData.split(",")[1],
    },
  };

  const analysisResponse = await ai.models.generateContent({
    model,
    contents: { parts: [imagePart, { text: analysisPrompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          topicDetected: { type: Type.STRING },
          summary: { type: Type.STRING },
          searchQuery: { type: Type.STRING },
        },
        required: ["keywords", "topicDetected", "summary", "searchQuery"],
      },
    },
  });

  const analysis = JSON.parse(analysisResponse.text || "{}");

  // Step 2: Search with Tavily
  const searchResults = await tv.search(analysis.searchQuery, {
    searchDepth: "advanced",
    maxResults: 5,
    includeAnswer: true,
  });

  const searchContext = searchResults.results.map(r => `Source: ${r.url}\nContent: ${r.content}`).join("\n\n");

  // Step 3: Generate final question bank
  const finalPrompt = `
    Based on the following search results and the identified topic "${analysis.topicDetected}", generate a high-quality chemistry question bank.
    Target Exams: ${exams.join(", ")}.
    
    Search Results:
    ${searchContext}
    
    Requirements:
    1. Generate 5-8 questions.
    2. Each question MUST have 4 options (A, B, C, D) and the correct answer.
    3. Categorize them as PYQ, HOTS, or Official Question Bank.
    4. Include source and year if available in the search results.
    
    Return JSON:
    {
      "questions": [
        {
          "text": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "Correct Option Text or Letter",
          "source": "Source",
          "year": "Year",
          "type": "PYQ/HOTS/Official Question Bank",
          "topic": "Sub-topic"
        }
      ]
    }
  `;

  const finalResponse = await ai.models.generateContent({
    model,
    contents: finalPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                answer: { type: Type.STRING },
                source: { type: Type.STRING },
                year: { type: Type.STRING },
                type: { type: Type.STRING },
                topic: { type: Type.STRING },
              },
              required: ["text", "options", "answer", "source", "year", "type", "topic"],
            },
          },
        },
        required: ["questions"],
      },
    },
  });

  const finalResult = JSON.parse(finalResponse.text || "{}");

  return {
    ...analysis,
    questions: finalResult.questions,
  };
}
