import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import crypto from "crypto";
import { GoogleGenAI, Type } from "@google/genai";
import { tavily } from "@tavily/core";
import admin from "firebase-admin";
import Razorpay from "razorpay";

// ─── Firebase Admin ───────────────────────────────────────────────────────────
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Credit Packs (source of truth — shared with /api/config) ────────────────
const CREDIT_PACKS = {
  starter: { credits: 5,  amount: 4900,  name: "Starter Pack",  display: "₹49"  },
  value:   { credits: 15, amount: 12900, name: "Value Pack",    display: "₹129" },
  study:   { credits: 35, amount: 27900, name: "Study Pack",    display: "₹279" },
} as const;
type PackId = keyof typeof CREDIT_PACKS;

const FREE_WELCOME_CREDITS = 3;

// ─── Razorpay client ──────────────────────────────────────────────────────────
function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay keys not configured");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(cors());

  // ─── RAW BODY for Razorpay webhook ───────────────────────────────────────
  // (optional: if you want to use webhooks in addition to client-side verification)
  app.use("/api/razorpay-webhook", express.raw({ type: "application/json" }));
  app.use(express.json({ limit: "50mb" }));

  // ─── Helper: verify Firebase ID token ────────────────────────────────────
  async function verifyToken(authHeader: string | undefined): Promise<string> {
    const token = authHeader?.split("Bearer ")[1];
    if (!token) throw new Error("AUTH_MISSING");
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      return decoded.uid;
    } catch {
      throw new Error("AUTH_INVALID");
    }
  }

  // ─── PUBLIC CONFIG ────────────────────────────────────────────────────────
  app.get("/api/config", (req, res) => {
    res.json({
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
      creditPacks: CREDIT_PACKS,
      freeCredits: FREE_WELCOME_CREDITS,
    });
  });

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // ─── RAZORPAY: Create Order ───────────────────────────────────────────────
  app.post("/api/create-order", async (req, res) => {
    try {
      const { packId } = req.body;
      const pack = CREDIT_PACKS[packId as PackId];
      if (!pack) return res.status(400).json({ error: "Invalid pack ID" });

      const rzp = getRazorpay();
      const order = await rzp.orders.create({
        amount: pack.amount,
        currency: "INR",
        notes: { packId, credits: String(pack.credits) },
      });

      res.json({ orderId: order.id, amount: pack.amount, currency: "INR", packId });
    } catch (err: any) {
      console.error("Create order error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ─── RAZORPAY: Verify Payment + Add Credits ───────────────────────────────
  app.post("/api/verify-payment", async (req, res) => {
    try {
      const uid = await verifyToken(req.headers.authorization);

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packId } = req.body;
      const pack = CREDIT_PACKS[packId as PackId];
      if (!pack) return res.status(400).json({ error: "Invalid pack ID" });

      // Cryptographic signature verification (cannot be forged)
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) return res.status(500).json({ error: "Server config error" });

      const expectedSig = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSig !== razorpay_signature) {
        return res.status(400).json({ error: "Payment verification failed" });
      }

      // Atomically add credits (Firebase transaction — race-condition safe)
      const profileRef = db.doc(`users/${uid}/profile/data`);
      await db.runTransaction(async (t) => {
        const doc = await t.get(profileRef);
        const current = doc.exists ? (doc.data()?.credits || 0) : 0;
        t.set(profileRef, { credits: current + pack.credits }, { merge: true });
      });

      console.log(`[Payment] uid=${uid} pack=${packId} credits=${pack.credits}`);
      res.json({ success: true, creditsAdded: pack.credits });
    } catch (err: any) {
      console.error("Verify payment error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ─── SECURE SCAN PIPELINE ─────────────────────────────────────────────────
  // Exactly 2 Gemini calls + 3 Tavily searches, regardless of image/topic count
  app.post("/api/scan", async (req, res) => {
    let uid: string | null = null;

    try {
      // 1. Authenticate user
      uid = await verifyToken(req.headers.authorization);
    } catch (err: any) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      // 2. Validate images
      const { images, topic, subject, exams } = req.body;
      const imageList: string[] = Array.isArray(images) ? images : [images || req.body.image];
      const MAX_IMAGES = 8;

      if (!imageList.length || !imageList[0]) {
        return res.status(400).json({ error: "No images provided" });
      }
      if (imageList.length > MAX_IMAGES) {
        return res.status(400).json({
          error: `Maximum ${MAX_IMAGES} pages per scan. You uploaded ${imageList.length}.`
        });
      }

      // 3. Atomically check and deduct 1 credit
      const profileRef = db.doc(`users/${uid}/profile/data`);
      try {
        await db.runTransaction(async (t) => {
          const doc = await t.get(profileRef);
          const credits = doc.exists ? (doc.data()?.credits || 0) : 0;
          if (credits <= 0) throw new Error("INSUFFICIENT_CREDITS");
          t.update(profileRef, { credits: credits - 1 });
        });
      } catch (err: any) {
        if (err.message === "INSUFFICIENT_CREDITS") {
          return res.status(402).json({ error: "Insufficient credits. Please purchase a pack." });
        }
        throw err;
      }

      // 4. Get API keys
      const geminiKey = process.env.GEMINI_API_KEY || process.env.chem1;
      const tavilyKey = process.env.TAVILY_API_KEY;
      if (!geminiKey || !tavilyKey) {
        // Refund the credit if config is broken
        await profileRef.update({ credits: admin.firestore.FieldValue.increment(1) });
        return res.status(500).json({ error: "Server API keys not configured" });
      }

      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const tv = tavily({ apiKey: tavilyKey });

      // ── STEP 1: Gemini Vision — deduplicate topics across ALL images, generate 3 queries ──
      const examMap: Record<string, string> = {
        "jee-mains": "JEE Mains", "jee-advanced": "JEE Advanced",
        "cbse-12": "CBSE Class 12", "cbse-10": "CBSE Class 10",
        "icse-10": "ICSE Class 10", "isc-12": "ISC Class 12",
        "wbsche-12": "WBSCHE Class 12",
      };
      const examLabels = (exams as string[]).map(e => examMap[e] || e);
      const primaryExam = examLabels[0] || "exam";
      const allExams = examLabels.join(" ");
      const subjectLabel = subject || "Chemistry";

      const imageParts = imageList.map((img: string) => ({
        inlineData: {
          mimeType: img.startsWith("data:image/png") ? "image/png" : "image/jpeg",
          data: img.split(",")[1],
        },
      }));

      const analysisPrompt = [
        `You are analyzing ${subjectLabel} notes for a student preparing for: ${examLabels.join(", ")}.`,
        `Subject: ${subjectLabel}. Topic hint from user: "${topic}". Pages uploaded: ${imageList.length}.`,
        "",
        "STEP 1 — Extract and DEDUPLICATE topics:",
        `Look at ALL images together as one set of notes. List every unique sub-topic, concept, formula, and diagram across ALL pages. Deduplicate — if the same concept appears multiple times, count it ONCE. Stay strictly within the subject: ${subjectLabel}.`,
        "",
        "STEP 2 — Generate EXACTLY 3 search queries:",
        "Each query must cover ALL detected topics together in a single search string (use OR to combine topics).",
        "Generate EXACTLY 3 queries for these 3 angles. Do NOT generate one query per topic.",
        `Query 1: (topic1 OR topic2 OR ...) ${subjectLabel} ${primaryExam} PYQ past year questions solutions`,
        `Query 2: (topic1 OR topic2 OR ...) ${subjectLabel} ${primaryExam} sample paper MCQ`,
        `Query 3: (topic1 OR topic2 OR ...) ${subjectLabel} HOTS important questions ${allExams}`,
      ].join("\n");

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
      console.log(`[Scan] uid=${uid} subject=${subjectLabel} topic=${analysis.topicDetected} queries=${analysis.searchQueries?.length}`);

      // ── STEP 2: Always exactly 3 Tavily searches — fixed cost ──
      const queries = (analysis.searchQueries || []).slice(0, 3);
      const allSearchResults = await Promise.all(
        queries.map((q: string) =>
          tv.search(q, { searchDepth: "basic", maxResults: 5 })
            .catch(err => { console.error(`Tavily failed: ${q}`, err.message); return { results: [] }; })
        )
      );

      const seenUrls = new Set<string>();
      const combined: string[] = [];
      for (const sr of allSearchResults) {
        for (const r of (sr.results || [])) {
          if (!seenUrls.has(r.url)) {
            seenUrls.add(r.url);
            combined.push(`[Source: ${r.url}]\n${r.content}`);
          }
        }
      }
      console.log(`[Scan] ${combined.length} unique sources found`);

      // ── STEP 3: Gemini structures real questions from search results ──
      const structurePrompt = [
        `You are a question bank organizer for ${examLabels.join(", ")} exams. Subject: ${subjectLabel}.`,
        `Topic: "${analysis.topicDetected}".`,
        "",
        "Below are web search results containing real exam questions.",
        "Your job is to EXTRACT and ORGANIZE actual questions found in these results.",
        "",
        "Rules:",
        "- ONLY use questions that appear in the search results. Do NOT invent questions.",
        "- Each question must have exactly 4 options (A, B, C, D) and a correct answer.",
        "- If a question lacks options, create plausible options grounded in the content.",
        "- Categorize as: PYQ, Sample Paper, HOTS, or Practice",
        "- Include source URL and year if mentioned.",
        `- Extract as many valid questions as possible (aim for 8–15). Stay within ${subjectLabel}: "${analysis.topicDetected}".`,
        "",
        `Search Results:\n${combined.join("\n---\n")}`,
      ].join("\n");

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
      // Refund the credit if scan itself failed after deduction
      if (uid) {
        await db.doc(`users/${uid}/profile/data`)
          .update({ credits: admin.firestore.FieldValue.increment(1) })
          .catch(() => {}); // best-effort refund
      }
      console.error("Scan error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Serve frontend ───────────────────────────────────────────────────────
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
