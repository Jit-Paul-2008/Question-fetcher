import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";
import { tavily } from "@tavily/core";
import admin from "firebase-admin";

// Initialize Firebase Admin (uses Application Default Credentials on GCP)
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Use CORS if needed (e.g. for Vercel frontend)
  app.use(cors());

  // Stripe Webhook needs raw body for signature verification
  app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not set");
      return res.status(500).send("Webhook secret not configured");
    }

    let event;
    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (userId) {
        console.log(`Payment success for user: ${userId}`);
        await db.doc(`users/${userId}/profile/data`).set({ isPremium: true }, { merge: true });
      }
    }

    res.json({ received: true });
  });

  // Standard JSON middleware for other routes (large limit for multi-image payloads)
  app.use(express.json({ limit: "50mb" }));

  let stripeClient: Stripe | null = null;
  function getStripe(): Stripe {
    if (!stripeClient) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) throw new Error("STRIPE_SECRET_KEY not found");
      stripeClient = new Stripe(key, { apiVersion: "2025-02-24.acacia" as any });
    }
    return stripeClient;
  }

  // API Routes
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { returnUrl, userId } = req.body;
      const stripe = getStripe();
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { 
              name: "ChemScan Premium",
              description: "Unlock unlimited chemistry note scans." 
            },
            unit_amount: 500,
          },
          quantity: 1,
        }],
        metadata: { userId }, // Critical for linking payment to user
        mode: "payment",
        success_url: `${returnUrl}?success=true`,
        cancel_url: `${returnUrl}?canceled=true`,
      });
      
      res.json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // OPTIMIZED SCAN PIPELINE
  // Architecture: Multi-image → 1 Gemini vision → N parallel Tavily → 1 Gemini structure
  // Total: exactly 2 Gemini calls regardless of image count
  app.post("/api/scan", express.json({ limit: "50mb" }), async (req, res) => {
    try {
      const { images, topic, exams } = req.body;
      // Support both single image (legacy) and multiple images
      const imageList: string[] = Array.isArray(images) ? images : [images || req.body.image];
      
      if (!imageList.length || !imageList[0]) {
        return res.status(400).json({ error: "No images provided" });
      }

      const geminiKey = process.env.GEMINI_API_KEY || process.env.chem1;
      const tavilyKey = process.env.TAVILY_API_KEY;

      if (!geminiKey || !tavilyKey) {
        return res.status(500).json({ error: "Server API keys not configured" });
      }

      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const tv = tavily({ apiKey: tavilyKey });

      // ─── STEP 1: Single Gemini Vision Call (all images at once) ───
      const examLabels = exams.map((e: string) => {
        const found = [
          { id: "jee-mains", label: "JEE Mains" },
          { id: "jee-advanced", label: "JEE Advanced" },
          { id: "cbse-12", label: "CBSE Class 12" },
          { id: "cbse-10", label: "CBSE Class 10" },
          { id: "icse-10", label: "ICSE Class 10" },
          { id: "isc-12", label: "ISC Class 12" },
          { id: "wbsche-12", label: "WBSCHE Class 12" },
        ].find(x => x.id === e);
        return found ? found.label : e;
      });

      const imageParts = imageList.map((img: string) => ({
        inlineData: {
          mimeType: img.startsWith("data:image/png") ? "image/png" : "image/jpeg",
          data: img.split(",")[1],
        },
      }));

      const analysisPrompt = `You are analyzing chemistry notes for a student preparing for: ${examLabels.join(", ")}.
Topic hint: "${topic}".

From the uploaded image(s), extract:
1. The exact sub-topics and concepts visible (e.g., "Le Chatelier's Principle", "SN1 vs SN2 mechanisms")
2. Key formulas, reactions, or diagrams shown
3. Generate 3-4 highly specific web search queries designed to find REAL past exam questions (PYQs), sample paper questions, and HOTS questions for these exact topics from ${examLabels.join(", ")}.

Each search query should target a different angle:
- Query 1: PYQ questions with solutions
- Query 2: Sample paper / mock test questions  
- Query 3: HOTS / higher order thinking questions
- Query 4: MCQ question bank (if applicable)

Keep queries specific to the detected sub-topic, NOT generic like "chemistry questions".`;

      const analysisResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: { parts: [...imageParts, { text: analysisPrompt }] },
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

      const analysis = JSON.parse(analysisResponse.text || "{}");
      console.log(`[Scan] Topic: ${analysis.topicDetected}, Queries: ${analysis.searchQueries?.length}`);

      // ─── STEP 2: Parallel Tavily Searches (cheap, basic tier) ───
      const queries = (analysis.searchQueries || []).slice(0, 4);
      const searchPromises = queries.map((q: string) =>
        tv.search(q, { searchDepth: "basic", maxResults: 5 })
          .catch(err => {
            console.error(`Tavily search failed for: ${q}`, err.message);
            return { results: [] };
          })
      );

      const allSearchResults = await Promise.all(searchPromises);
      
      // Deduplicate and combine results
      const seenUrls = new Set<string>();
      const combinedResults: string[] = [];
      for (const sr of allSearchResults) {
        for (const r of (sr.results || [])) {
          if (!seenUrls.has(r.url)) {
            seenUrls.add(r.url);
            combinedResults.push(`[Source: ${r.url}]\n${r.content}`);
          }
        }
      }

      const searchContext = combinedResults.join("\n---\n");
      console.log(`[Scan] Found ${combinedResults.length} unique sources`);

      // ─── STEP 3: Single Gemini Call to Structure Results ───
      // This call ONLY organizes existing data, it does NOT generate questions
      const structurePrompt = `You are a question bank organizer for ${examLabels.join(", ")} exams.
Topic: "${analysis.topicDetected}" (${topic}).

Below are web search results containing real exam questions, sample paper questions, PYQs, and practice problems.
Your job is to EXTRACT and ORGANIZE the actual questions found in the search results.

Rules:
- ONLY use questions that appear in the search results. Do NOT invent questions.
- Each question must have exactly 4 options (A, B, C, D) and a correct answer.
- If a question from the results doesn't have options, create plausible options based on the content.
- If the answer is provided in the source, use it. If not, determine the correct answer.
- Categorize each as: "PYQ" (past year question), "Sample Paper", "HOTS", or "Practice"
- Include the source URL and year if mentioned.
- Extract as many valid questions as possible (aim for 8-15).
- Stay strictly within the topic "${analysis.topicDetected}". Ignore unrelated questions.

Search Results:
${searchContext}`;

      const structureResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: structurePrompt,
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

      const structured = JSON.parse(structureResponse.text || "{}");
      console.log(`[Scan] Extracted ${structured.questions?.length || 0} questions`);

      res.json({
        topicDetected: analysis.topicDetected,
        summary: analysis.summary,
        keywords: analysis.keywords || [],
        questions: structured.questions || [],
      });
    } catch (error: any) {
      console.error("Scan error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Production middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
}

startServer();
