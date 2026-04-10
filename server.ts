import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import crypto from "crypto";
import { GoogleGenAI, Type } from "@google/genai";
import { tavily } from "@tavily/core";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import Razorpay from "razorpay";
import mammoth from "mammoth";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Firebase Admin ───────────────────────────────────────────────────────────
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || "gen-lang-client-0312116426",
  });
}
const db = getFirestore("ai-studio-037afd9e-7975-495a-b35d-27afa336d0de");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Credit Packs (source of truth — shared with /api/config) ────────────────
const CREDIT_PACKS = {
  starter: { credits: 5, amount: 4900, name: "Starter Pack", display: "₹49" },
  value: { credits: 15, amount: 12900, name: "Value Pack", display: "₹129" },
  study: { credits: 35, amount: 27900, name: "Study Pack", display: "₹279" },
} as const;
type PackId = keyof typeof CREDIT_PACKS;

const FREE_WELCOME_CREDITS = 3;

// ─── Razorpay client ──────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// ─── Pinecone & Embedding Init ──────────────────────────────────────────────
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || "" });
const pcIndex = pc.index("chemscan");
const genAIEmbed = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const embedModel = genAIEmbed.getGenerativeModel({ model: "text-embedding-004" });

async function getTopicEmbedding(text: string) {
  try {
    const result = await embedModel.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.error("[Embedding:Error]", err);
    return null;
  }
}

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay keys not configured");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// ─── Retry Helper for AI Calls ───────────────────────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      // Check for 503 or overload messages
      const is503 = err.message?.includes("503") || err.status === 503 || err.code === 503 || err.message?.includes("high demand") || err.message?.includes("UNAVAILABLE");
      if (is503 && i < retries - 1) {
        console.warn(`[Retry] Gemini busy/503. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
  throw lastError;
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

  // ─── Domain Mapping for Targeted Searching ──────────────────────────────────
  const EXAM_DOMAINS: Record<string, string[]> = {
    jee: ["mathongo.com", "esaral.com", "vedantu.com", "toppr.com", "careers360.com", "allen.ac.in", "pw.live"],
    neet: ["aakash.ac.in", "doubtnut.com", "vedantu.com", "toppr.com", "careers360.com", "pw.live"],
    boards: ["learncbse.in", "selfstudys.com", "shaalaa.com", "byjus.com", "ncert.nic.in", "aglasem.com", "collegedekho.com", "pw.live"],
    default: ["byjus.com", "toppr.com", "vedantu.com", "shaalaa.com", "careers360.com", "selfstudys.com", "pw.live"]
  };

  function getIncludeDomains(exams: string[]): string[] {
    const domains = new Set<string>();
    if (!exams || exams.length === 0) return EXAM_DOMAINS.default;

    exams.forEach(exam => {
      const e = exam.toLowerCase();
      if (e.includes("jee")) {
        EXAM_DOMAINS.jee.forEach(d => domains.add(d));
      } else if (e.includes("neet")) {
        EXAM_DOMAINS.neet.forEach(d => domains.add(d));
      } else if (e.includes("cbse") || e.includes("icse") || e.includes("isc") || e.includes("wbsche") || e.includes("board")) {
        EXAM_DOMAINS.boards.forEach(d => domains.add(d));
      }
    });

    return domains.size > 0 ? Array.from(domains) : EXAM_DOMAINS.default;
  }

  // ─── Cache Key Generator (RAG) ─────────────────────────────────────────────
  function getCacheKey(subject: string, topic: string, exams: string[]) {
    const sortedExams = [...exams].sort().join(",");
    const raw = `${subject.toLowerCase()}|${topic.toLowerCase().trim()}|${sortedExams}`;
    return crypto.createHash("md5").update(raw).digest("hex");
  }


  // ─── Razorpay: Create Order ───────────────────────────────────────────────
  app.post("/api/create-order", async (req, res) => {
    try {
      const { packId, uid } = req.body; // Added uid
      const pack = CREDIT_PACKS[packId as PackId];
      if (!pack) return res.status(400).json({ error: "Invalid pack ID" });

      const rzp = getRazorpay();
      const order = await rzp.orders.create({
        amount: pack.amount,
        currency: "INR",
        notes: { 
          packId, 
          credits: String(pack.credits), 
          uid: uid || "unknown" // Store uid in order for webhook retrieval
        },
      });

      res.json({ orderId: order.id, amount: pack.amount, currency: "INR", packId });
    } catch (err: any) {
      console.error("Create order error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Helper: Atomically Add Credits with Deduplication ───────────────────
  async function creditUser(uid: string, creditsToAdd: number, paymentId: string, packId: string) {
    const paymentRef = db.collection("payments").doc(paymentId);
    const profileRef = db.doc(`users/${uid}/profile/data`);

    await db.runTransaction(async (t) => {
      const paymentDoc = await t.get(paymentRef);
      if (paymentDoc.exists) {
        console.log(`[Deduplication] Payment ${paymentId} already processed.`);
        return;
      }

      const profileDoc = await t.get(profileRef);
      const current = profileDoc.exists ? (profileDoc.data()?.credits || 0) : 0;

      t.set(paymentRef, {
        uid,
        packId,
        credits: creditsToAdd,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      t.set(profileRef, { credits: current + creditsToAdd }, { merge: true });
    });
  }

  // ─── Helper: Revoke Credits on Refund ────────────────────────────────────
  async function revokeCredits(paymentId: string) {
    const paymentRef = db.collection("payments").doc(paymentId);

    await db.runTransaction(async (t) => {
      const paymentDoc = await t.get(paymentRef);
      if (!paymentDoc.exists) {
        console.warn(`[Refund] No record found for payment ${paymentId}. Cannot revoke credits.`);
        return;
      }

      const data = paymentDoc.data()!;
      if (data.refunded) {
        console.log(`[Refund] Already processed for ${paymentId}.`);
        return;
      }

      const { uid, credits } = data;
      const profileRef = db.doc(`users/${uid}/profile/data`);
      const profileDoc = await t.get(profileRef);

      const current = profileDoc.exists ? (profileDoc.data()?.credits || 0) : 0;

      // Deduct credits, ensuring we don't go negative
      t.set(profileRef, { credits: Math.max(0, current - credits) }, { merge: true });
      // Mark payment as refunded in our tracker
      t.update(paymentRef, { refunded: true, refundTimestamp: admin.firestore.FieldValue.serverTimestamp() });

      console.log(`[Refund:Success] Revoked ${credits} credits from ${uid} for payment ${paymentId}`);
    });
  }


  // ─── RAZORPAY: Verify Payment (Client-side callback) ─────────────────────
  app.post("/api/verify-payment", async (req, res) => {
    try {
      const uid = await verifyToken(req.headers.authorization);

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packId } = req.body;
      const pack = CREDIT_PACKS[packId as PackId];
      if (!pack) return res.status(400).json({ error: "Invalid pack ID" });

      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) return res.status(500).json({ error: "Server config error" });

      const expectedSig = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSig !== razorpay_signature) {
        return res.status(400).json({ error: "Payment verification failed" });
      }

      // Use the deduplicated credit helper
      await creditUser(uid, pack.credits, razorpay_payment_id, packId);

      console.log(`[Payment:Verify] uid=${uid} pack=${packId} credits=${pack.credits}`);
      res.json({ success: true, creditsAdded: pack.credits });
    } catch (err: any) {
      console.error("Verify payment error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ─── RAZORPAY: Webhook (Server-to-Server reliability) ─────────────────────
  app.post("/api/razorpay-webhook", async (req: express.Request, res: express.Response) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"] as string;

    // 1. Verify webhook signature
    if (secret && signature) {
      const expectedSig = crypto
        .createHmac("sha256", secret)
        .update(req.body) // req.body is raw buffer because of express.raw middleware at line 74
        .digest("hex");

      if (expectedSig !== signature) {
        console.warn("[Webhook] Invalid signature received.");
        return res.status(400).send("Invalid signature");
      }
    } else if (!signature && secret) {
       console.warn("[Webhook] Missing signature header.");
       return res.status(400).send("Missing signature");
    }

    try {
      // Parse raw body buffer to JSON
      const event = JSON.parse(req.body.toString());
      console.log(`[Webhook] Event: ${event.event}`);

      if (event.event === "payment.captured") {
        const payment = event.payload.payment.entity;
        const { order_id, id: payment_id, notes } = payment;
        const { uid, packId, credits } = notes || {};

        if (uid && packId && credits) {
          await creditUser(uid, parseInt(credits, 10), payment_id, packId);
          console.log(`[Webhook:Capture] Credited ${credits} to ${uid} for payment ${payment_id}`);
        } else {
          console.warn(`[Webhook] Missing notes in payment ${payment_id}`, notes);
        }
      } 
      else if (event.event === "refund.processed") {
        const refund = event.payload.refund.entity;
        const payment_id = refund.payment_id;
        console.log(`[Webhook:Refund] Processing refund for payment ${payment_id}`);
        await revokeCredits(payment_id);
      } 
      else if (event.event === "payment.failed") {
        const payment = event.payload.payment.entity;
        console.warn(`[Webhook:Failed] Payment ${payment.id} failed. Reason: ${payment.error_description || "Unknown"}`);
      }

      res.status(200).json({ status: "ok" });
    } catch (err: any) {

      console.error("[Webhook] Processing error:", err.message);
      res.status(500).send("Internal Error");
    }
  });

  // ─── COMMUNITY LIBRARY: Publish ───────────────────────────────────────────
  app.post("/api/publish", async (req, res) => {
    try {
      const uid = await verifyToken(req.headers.authorization);
      const { bank } = req.body;
      if (!bank || !bank.questions) return res.status(400).json({ error: "No bank data provided" });

      const userDoc = await db.doc(`users/${uid}/profile/data`).get();
      const userName = userDoc.exists ? (userDoc.data()?.name || "Student") : "Student";

      const docRef = db.collection("community_library").doc();
      await docRef.set({
        ...bank,
        authorUid: uid,
        authorName: userName,
        downloads: 0,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true, id: docRef.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── COMMUNITY LIBRARY: Fetch ──────────────────────────────────────────────
  app.get("/api/library", async (req, res) => {
    try {
      const snapshot = await db.collection("community_library")
        .orderBy("timestamp", "desc")
        .limit(20)
        .get();
      
      const banks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ banks });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── CLASSROOM: Create Code ────────────────────────────────────────────────
  app.post("/api/classroom/create", async (req, res) => {
    try {
      const uid = await verifyToken(req.headers.authorization);
      const { bank } = req.body;
      if (!bank) return res.status(400).json({ error: "No bank data provided" });

      // Generate a 6-digit alphanumeric code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      await db.collection("classrooms").doc(code).set({
        ...bank,
        creatorUid: uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true, code });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── CLASSROOM: Join ───────────────────────────────────────────────────────
  app.post("/api/classroom/join", async (req, res) => {
    try {
      await verifyToken(req.headers.authorization);
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "Code required" });

      const doc = await db.collection("classrooms").doc(code.toUpperCase()).get();
      if (!doc.exists) return res.status(404).json({ error: "Classroom not found" });

      res.json({ success: true, ...doc.data() });
    } catch (err: any) {
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

      const { images, topic, subject, exams } = req.body;
      const imageList: string[] = Array.isArray(images) ? images : (images ? [images] : []);
      const MAX_IMAGES = 8;

      if (imageList.length === 0 && (!topic || topic.trim().length === 0)) {
        return res.status(400).json({ error: "Please provide either notes (images/PDF) or specific topics to scan." });
      }
      if (imageList.length > MAX_IMAGES) {
        return res.status(400).json({
          error: `Maximum ${MAX_IMAGES} files per scan. You uploaded ${imageList.length}.`
        });
      }

      const examList = Array.isArray(exams) ? exams : [];
      const subjectLabel = subject || "Chemistry";


      // ─── SEMANTIC CACHE CHECK (Hybrid Pinecone + Firestore) ──────────────
      let cachedData: any = null;
      const isTopicOnly = imageList.length === 0;
      const cacheKey = getCacheKey(subjectLabel, topic || "", examList);

      if (isTopicOnly) {
        // 1. Try Exact Match First (Fastest/Cheapest)
        const cacheRef = db.collection("global_cache").doc(cacheKey);
        const cacheDoc = await cacheRef.get();
        if (cacheDoc.exists) {
          console.log(`[Cache:EXACT_HIT] key=${cacheKey}`);
          cachedData = cacheDoc.data();
        } else {
          // 2. Try Semantic Match (Pinecone)
          console.log(`[Cache:SEMANTIC_PULL] topic="${topic}"`);
          const vector = await getTopicEmbedding(topic || "");
          if (vector) {
            const queryResponse = await pcIndex.query({
              vector,
              topK: 1,
              includeMetadata: true,
            });

            const bestMatch = queryResponse.matches[0];
            if (bestMatch && bestMatch.score && bestMatch.score > 0.88) {
              const semanticDoc = await db.collection("global_cache").doc(bestMatch.id).get();
              if (semanticDoc.exists) {
                console.log(`[Cache:SEMANTIC_HIT] score=${bestMatch.score.toFixed(3)} topicDetected="${bestMatch.metadata?.topicDetected}"`);
                cachedData = semanticDoc.data();
              }
            }
          }
        }

        if (cachedData) {
          const age = Date.now() - (cachedData.timestamp?.toMillis() || 0);
          const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
          if (age < SEVEN_DAYS) {
            return res.json({
              topicDetected: cachedData.topicDetected,
              summary: cachedData.summary,
              keywords: cachedData.keywords || [],
              questions: cachedData.questions || [],
              isPopular: true
            });
          }
        }
      }
      console.log(`[Cache:MISS] key=${cacheKey} topic="${topic}"`);

      const geminiKey = process.env.GEMINI_API_KEY || process.env.chem1;
      const tavilyKey = process.env.TAVILY_API_KEY;
      if (!geminiKey || !tavilyKey) {
        console.error("Missing API Keys: GEMINI_API_KEY or TAVILY_API_KEY not found in environment.");
        return res.status(500).json({ error: "Server API keys not configured. Please check your .env file." });
      }

      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const tv = tavily({ apiKey: tavilyKey });

      const examMap: Record<string, string> = {
        "jee-mains": "JEE Mains", "jee-advanced": "JEE Advanced",
        "cbse-12": "CBSE Class 12", "cbse-10": "CBSE Class 10",
        "icse-10": "ICSE Class 10", "isc-12": "ISC Class 12",
        "wbsche-12": "WBSCHE Class 12",
      };
      const examLabels = examList.map(e => examMap[e] || e);
      const primaryExam = examLabels[0] || "exam";
      const allExams = examLabels.join(" ");

      const contentParts: any[] = [];
      const docxTexts: string[] = [];

      for (const item of imageList) {
        if (!item || typeof item !== "string") continue;
        const [meta, base64Data] = item.split(",");
        if (!base64Data) continue;
        const mimeType = (meta.match(/data:(.*?);/) || [])[1] || "image/jpeg";

        if (mimeType.includes("image") || mimeType === "application/pdf") {
          contentParts.push({ inlineData: { mimeType, data: base64Data } });
        } else if (mimeType.includes("officedocument") || mimeType.includes("word") || item.includes(".docx")) {
          try {
            const buffer = Buffer.from(base64Data, "base64");
            const result = await mammoth.extractRawText({ buffer });
            docxTexts.push(result.value);
          } catch (err) {
            console.error("DOCX extraction error:", err);
          }
        }
      }

      let analysisText = "";

      try {
        if (imageList.length === 0) {
          // ── TOPIC ONLY MODE ──
          const topicPrompt = [
            `You are assisting a student preparing for: ${examLabels.join(", ")}.`,
            `Subject: ${subjectLabel}. Topics provided: "${topic}".`,
            "",
            "STEP 1 — Brainstorm Search Queries:",
            "Based on the provided topics, generate 3 highly targeted search queries to find real exam questions.",
            "Distribute the topics across the 3 queries.",
            `Query 1: Focus on core PYQs for: ${topic}.`,
            `Query 2: Focus on Sample Paper MCQs and detailed solutions for: ${topic}.`,
            `Query 3: Focus on HOTS (Higher Order Thinking Skills) and complex problems for: ${topic}.`,
          ].join("\n");

          const response = await withRetry(() =>
            ai.models.generateContent({
              model: "gemini-3.1-flash-lite-preview",
              contents: { parts: [{ text: topicPrompt }] },
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
            })
          );
          analysisText = response.text || "";
        } else {
          // ── Vision / Notes Mode ──
          const analysisPrompt = [
            `You are analyzing ${subjectLabel} documents/images for a student preparing for: ${examLabels.join(", ")}.`,
            `Subject: ${subjectLabel}. Topic: "${topic}". Files uploaded: ${imageList.length}.`,
            "",
            docxTexts.length > 0 ? `Additional text content from DOCX files:\n${docxTexts.join("\n\n")}\n` : "",
            "STEP 1 — Extract and DEDUPLICATE topics:",
            `Look at ALL uploaded content (images, PDFs, text) together as a single set of studies. List every unique sub-topic, formula, and diagram. Stay strictly within the subject: ${subjectLabel}.`,
            "",
            "STEP 2 — Generate EXACTLY 3 diverse search queries:",
            "Distribute the detected topics across the 3 queries so each query is specific and targeted.",
            "Do NOT dump all topics into a single query — that dilutes results.",
            `Query 1: Focus on the TOP 1-2 most important topics. Format: (mainTopic1 OR mainTopic2) ${subjectLabel} ${primaryExam} PYQ past year questions with solutions`,
            `Query 2: Focus on the NEXT 1-2 topics. Format: (nextTopic1 OR nextTopic2) ${subjectLabel} ${primaryExam} sample paper MCQ questions`,
            `Query 3: Cover remaining topics + HOTS. Format: (remainingTopic1 OR remainingTopic2) ${subjectLabel} HOTS important questions ${allExams}`,
          ].join("\n");

          const analysisResponse = await withRetry(() =>
            ai.models.generateContent({
              model: "gemini-3.1-flash-lite-preview",
              contents: { parts: [...contentParts, { text: analysisPrompt }] },
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
            })
          );
          analysisText = analysisResponse.text || "";
        }
      } catch (err: any) {
        console.error("Gemini Vision Error:", err);
        await profileRef.update({ credits: admin.firestore.FieldValue.increment(1) }).catch(() => { });
        return res.status(400).json({ error: "The AI safety filters blocked this content or the model is unavailable. Please ensure your notes are subject-appropriate." });
      }

      let analysis: any = {};
      try {
        analysis = JSON.parse(analysisText || "{}");
      } catch (err) {
        await profileRef.update({ credits: admin.firestore.FieldValue.increment(1) }).catch(() => { });
        return res.status(500).json({ error: "AI analysis format error. Please try again." });
      }
      console.log(`[Scan] uid=${uid} subject=${subjectLabel} topic=${analysis.topicDetected} queries=${analysis.searchQueries?.length}`);

      // ── STEP 2: Always exactly 3 Tavily searches — fixed cost ──
      const rawQueries = (analysis.searchQueries || []).slice(0, 3);
      const queries = rawQueries.filter((q: string) => q && q.trim().length > 0);
      const includeDomains = getIncludeDomains(examList);

      const allSearchResults = await Promise.all(
        queries.map((q: string) =>
          tv.search(q, {
            searchDepth: "advanced",
            maxResults: 15,
            includeDomains: includeDomains
          })
            .catch(err => { console.error(`Tavily failed: ${q}`, err.message); return { results: [] }; })
        )
      );

      const seenUrls = new Set<string>();
      const combined: string[] = [];
      for (const sr of allSearchResults) {
        for (const r of (sr.results || [])) {
          if (!seenUrls.has(r.url)) {
            seenUrls.add(r.url);
            // Trim to 1500 chars — enough to capture full questions + options from most sources
            const snippet = (r.content || "").slice(0, 1500).trim();
            if (snippet) combined.push(`[Source: ${r.url}]\n${snippet}`);
          }
        }
      }
      console.log(`[Scan] ${combined.length} unique sources found`);

      // ── STEP 3: Gemini structures real questions from search results ──
      const structurePrompt = [
        combined.length > 0
          ? `Below are web search results containing real exam questions for ${analysis.topicDetected}. Your job is to EXTRACT and ORGANIZE actual questions found in these results.`
          : `Create high-quality original practice questions for the topic: "${analysis.topicDetected}". Since no specific web sources were found, use your expert knowledge to simulate real exam-style questions.`,
        "",
        "Rules:",
        "- If search results are present, prioritize them. If NOT, create original ones.",
        "- Each question must have exactly 4 options (A, B, C, D) and a correct answer.",
        "- Provide a solution key.",
        "- Categorize as: PYQ, Sample Paper, HOTS, or Practice",
        "- **Detailed Source Instruction**: Specify where the question is from in detail (e.g., 'PYQ 2023 JEE Mains', 'NEET 2021', 'CBSE Board 2020').",
        "- **NO LINKS**: Do NOT include any URLs or web links in the source field. Use only text describing the source.",
        "- **NO REPETITION**: Do not provide duplicate questions. Each question must be unique in content and phrasing.",
        `- Aim for 25-30 high-quality, unique questions. Stay within ${subjectLabel}: "${analysis.topicDetected}".`,
        "- If the search results do not contain enough questions, supplement with your EXPERT knowledge of exam-style questions for this topic — do not stop short.",
        "",
        combined.length > 0 ? `Search Results:\n${combined.join("\n---\n")}` : "No search results available. Proceed with expert generation.",
      ].join("\n");

      const structureResponse = await withRetry(() =>
        ai.models.generateContent({
          model: "gemini-3.1-flash-lite-preview",
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
        })
      );

      let structuredText = "";
      try {
        structuredText = structureResponse.text || "";
      } catch (err: any) {
        console.error("Gemini Structuring Error:", err);
        await profileRef.update({ credits: admin.firestore.FieldValue.increment(1) }).catch(() => { });
        return res.status(500).json({ error: `Question structuring failed: ${err.message}` });
      }

      try {
        structured = JSON.parse(structuredText || "{}");

        // ── Post-processing: Source detail & Deduplication ──
        if (structured.questions && Array.isArray(structured.questions)) {
          const uniqueTexts = new Set<string>();
          structured.questions = structured.questions.filter((q: any) => {
            if (q.source) {
              q.source = q.source.replace(/https?:\/\/[^\s]+/g, "").trim();
              if (!q.source) q.source = "Standard Practice Question";
            }
            const normalizedText = (q.text || "").toLowerCase().replace(/\s+/g, " ").trim();
            if (!normalizedText || uniqueTexts.has(normalizedText)) return false;
            uniqueTexts.add(normalizedText);
            return true;
          });
        }
      } catch (err) {
        await profileRef.update({ credits: admin.firestore.FieldValue.increment(1) }).catch(() => { });
        return res.status(500).json({ error: "AI structuring format error. Please try again." });
      }
      console.log(`[Scan] Extracted ${structured.questions?.length || 0} unique questions`);

      res.json({
        topicDetected: analysis.topicDetected || topic,
        summary: analysis.summary,
        keywords: analysis.keywords || [],
        questions: structured.questions || [],
      });

      // ─── SAVE TO CACHE (Hybrid Firestore + Pinecone) ─────────────────────
      if (isTopicOnly && structured.questions?.length > 0) {
        // Save full scan to Firestore
        db.collection("global_cache").doc(cacheKey).set({
          topicDetected: analysis.topicDetected || topic,
          summary: analysis.summary,
          keywords: analysis.keywords || [],
          questions: structured.questions,
          subject: subjectLabel,
          exams: examList,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        }).catch(err => console.error("[Cache:SaveError:Firestore]", err));

        // Save metadata & vector to Pinecone for future semantic searches
        (async () => {
           const vector = await getTopicEmbedding(analysis.topicDetected || topic);
           if (vector) {
             await pcIndex.upsert([{
               id: cacheKey,
               values: vector,
               metadata: { 
                 topicDetected: analysis.topicDetected || topic,
                 subject: subjectLabel 
               }
             }]);
             console.log(`[Cache:SAVE:Vector] key=${cacheKey}`);
           }
        })().catch(err => console.error("[Cache:SaveError:Pinecone]", err));
      }

    } catch (error: any) {
      if (uid) {
        await db.doc(`users/${uid}/profile/data`)
          .update({ credits: admin.firestore.FieldValue.increment(1) })
          .catch(() => { });
      }
      console.error("Scan error details:", error);
      const message = error.message || "Internal server error";
      res.status(500).json({ error: message });
    }
  });

  // ─── Knowledge Map API ────────────────────────────────────────────────────────
  app.get("/api/graph-data", async (req, res) => {
    try {
      // Fetch up to 100 recent question banks
      const snap = await db.collection("global_cache").limit(100).get();
      const nodes = snap.docs.map(doc => ({
        id: doc.id,
        topic: doc.data().topicDetected || "Unknown Topic",
        subject: doc.data().subject || "Chemistry",
      }));

      // No links for now, we will add them once the backfill is complete
      const links: any[] = [];
      res.json({ nodes, links });
    } catch (err) {
      console.error("[GraphData:Error]", err);
      res.status(500).json({ error: "Failed to fetch map data" });
    }
  });

  // ─── Admin Migration Endpoint (One-time use) ──────────────────────────────────
  app.post("/api/admin/backfill", async (req, res) => {
    try {
      const snap = await db.collection("global_cache").get();
      let vectorizedCount = 0;
      
      for (const doc of snap.docs) {
        const data = doc.data();
        const topic = data.topicDetected || "Unknown";
        const subject = data.subject || "General";
        const id = doc.id;

        // Vectorize and upsert
        const vector = await getTopicEmbedding(topic);
        if (vector) {
          await pcIndex.upsert([{
            id,
            values: vector,
            metadata: { topicDetected: topic, subject }
          }]);
          vectorizedCount++;
        }
      }
      res.json({ success: true, processed: snap.size, vectorized: vectorizedCount });
    } catch (err) {
      console.error("[Admin:Backfill:Error]", err);
      res.status(500).json({ error: "Backfill failed" });
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
