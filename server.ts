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

  // Standard JSON middleware for other routes
  app.use(express.json());

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

  // SECURE API SCAN (Moves keys to backend)
  app.post("/api/scan", async (req, res) => {
    try {
      const { image, topic, exams } = req.body;
      
      const geminiKey = process.env.GEMINI_API_KEY || process.env.chem1;
      const tavilyKey = process.env.TAVILY_API_KEY;

      if (!geminiKey || !tavilyKey) {
        return res.status(500).json({ error: "Server API keys not configured" });
      }

      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const tv = tavily({ apiKey: tavilyKey });
      const model = "gemini-2.0-flash";

      // Analysis Step
      const analysisPrompt = `Analyze this chemistry note. Guide: ${topic}. Search query for real ${exams.join(", ")} questions.`;
      const imagePart = { inlineData: { mimeType: "image/jpeg", data: image.split(",")[1] } };

      const analysisResponse = await ai.getGenerativeModel({ model }).generateContent({
        contents: [{ parts: [imagePart, { text: analysisPrompt }] }],
        generationConfig: {
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

      const analysis = JSON.parse(analysisResponse.response.text());

      // Search Step
      const searchResults = await tv.search(analysis.searchQuery, { searchDepth: "basic", maxResults: 5 });
      const searchContext = searchResults.results.map(r => `Source: ${r.url}\nContent: ${r.content}`).join("\n\n");

      // Final Question Gen
      const finalPrompt = `Based on topic "${analysis.topicDetected}", generate 5-8 chemistry questions for ${exams.join(", ")}.\n\nContext:\n${searchContext}`;
      const finalResponse = await ai.getGenerativeModel({ model }).generateContent({
        contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
        generationConfig: {
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

      const finalResult = JSON.parse(finalResponse.response.text());

      res.json({ ...analysis, questions: finalResult.questions });
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
