import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import crypto from "crypto";
import { spawn } from 'child_process';
import { GoogleGenAI, Type } from "@google/genai";
import { tavily } from "@tavily/core";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import Razorpay from "razorpay";
import mammoth from "mammoth";
import { Pinecone } from "@pinecone-database/pinecone";
import { verifyTextInProcess } from "./src/server/verifier/inProcessVerifier.js";
import { getCacheKey, getIncludeDomains } from "./src/server/scan/helpers.js";
import {
  CACHE_MAX_AGE_MS,
  CACHE_MIN_QUESTIONS,
  GEMINI_COST_BUFFER_INR,
  GEMINI_EMBEDDING_MODEL,
  GEMINI_GENERATION_MODEL,
  MAX_SCAN_COST_INR,
  MAX_TAVILY_QUERIES,
  MAX_TOPUP_ATTEMPTS,
  MIN_STRUCTURED_SOURCES,
  SUPPLEMENTAL_TAVILY_QUERIES,
  TAVILY_CREDIT_USD,
  TAVILY_MAX_RESULTS,
  TAVILY_SEARCH_DEPTH,
  USD_TO_INR,
} from "./src/server/config/scanConfig.js";
import fs from 'fs';

// ─── Constants & Utilities ───────────────────────────────────────────────────
const handleError = (res: any, error: any, context: string = "Server") => {
  console.error(`[${context}:Error]`, error);
  const message = error.message || "An unexpected error occurred";
  const status = error.status || 500;
  res.status(status).json({ error: message, context });
};
async function saveToUserHistory(uid: string, result: any, metadata: any) {
  try {
    const historyRef = db.collection(`users/${uid}/history`);
    await historyRef.add({
      ...result,
      ...metadata,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`[History:Saved] uid=${uid} topic=${result.topicDetected}`);
  } catch (err) {
    console.error(`[History:Error] uid=${uid}`, err);
  }
}

// ─── Firebase Admin ───────────────────────────────────────────────────────────
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || "gen-lang-client-0312116426",
  });
}
const db = getFirestore("ai-studio-037afd9e-7975-495a-b35d-27afa336d0de");

// ─── Credit Packs (source of truth — shared with /api/config) ────────────────
const CREDIT_PACKS = {
  starter: { credits: 5, amount: 4900, name: "Starter Pack", display: "₹49" },
  value: { credits: 15, amount: 12900, name: "Value Pack", display: "₹129" },
  study: { credits: 35, amount: 27900, name: "Study Pack", display: "₹279" },
} as const;
type PackId = keyof typeof CREDIT_PACKS;

const FREE_WELCOME_CREDITS = 3;

// ─── Razorpay client (Use getRazorpay() instead) ──────────────────────────

// ─── Pinecone & Embedding Init ──────────────────────────────────────────────
// ─── Pinecone & Embedding Init (Defensive for startup) ────────────────────────
let pc: Pinecone | null = null;
let pcIndex: any = null;

function getPinecone() {
  if (!pc) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      console.warn("[Pinecone:Warn] PINECONE_API_KEY not found in environment.");
      return null;
    }
    pc = new Pinecone({ apiKey });
  }
  return pc;
}

function getPineconeIndex() {
  const client = getPinecone();
  if (client && !pcIndex) {
    pcIndex = client.index("chemscan");
  }
  return pcIndex;
}

const genAIEmbed = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "DUMMY_KEY" });

async function getTopicEmbedding(text: string) {
  if (!GEMINI_EMBEDDING_MODEL) return null;
  try {
    const response = await withRetry(() => 
      genAIEmbed.models.embedContent({
        model: GEMINI_EMBEDDING_MODEL,
        contents: [{ parts: [{ text }] }],
        config: { outputDimensionality: 768 }
      })
    );
    return response.embeddings?.[0]?.values || null;
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

  type RateLimitBucket = { count: number; resetAt: number };
  const rateLimitStore = new Map<string, RateLimitBucket>();

  app.set("trust proxy", true);

  app.use(cors());

  // ─── RAW BODY for Razorpay webhook ───────────────────────────────────────
  // (optional: if you want to use webhooks in addition to client-side verification)
  app.use("/api/razorpay-webhook", express.raw({ type: "application/json" }));
  app.use(express.json({ limit: "50mb" }));

  // ─── Helper: verify Firebase ID token ────────────────────────────────────
  async function verifyToken(authHeader: string | undefined): Promise<string> {
    if (String(process.env.DRY_RUN || "false").toLowerCase() === "true") {
      return "dry-user";
    }
    const token = authHeader?.split("Bearer ")[1];
    if (!token) throw new Error("AUTH_MISSING");
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      return decoded.uid;
    } catch {
      throw new Error("AUTH_INVALID");
    }
  }

  function getClientIp(req: express.Request): string {
    const xff = req.headers["x-forwarded-for"];
    if (Array.isArray(xff) && xff.length > 0) {
      return xff[0].split(",")[0].trim();
    }
    if (typeof xff === "string" && xff.length > 0) {
      return xff.split(",")[0].trim();
    }
    return req.socket.remoteAddress || "unknown";
  }

  // No Redis: keep a simple in-memory rate limiter for single-instance deployments.

  function enforceInMemoryRateLimit(
    req: express.Request,
    res: express.Response,
    key: string,
    maxRequests: number,
    windowMs: number
  ): boolean {
    const now = Date.now();
    const bucketKey = `${key}:${getClientIp(req)}`;

    if (rateLimitStore.size > 5000) {
      for (const [k, bucket] of rateLimitStore.entries()) {
        if (bucket.resetAt <= now) rateLimitStore.delete(k);
      }
    }

    const existing = rateLimitStore.get(bucketKey);
    if (!existing || existing.resetAt <= now) {
      rateLimitStore.set(bucketKey, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (existing.count >= maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      res.status(429).json({ error: "Too many requests. Please retry shortly." });
      return false;
    }

    existing.count += 1;
    rateLimitStore.set(bucketKey, existing);
    return true;
  }

  async function enforceRateLimit(
    req: express.Request,
    res: express.Response,
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<boolean> {
    // Single-instance in-memory limiter.
    return enforceInMemoryRateLimit(req, res, key, maxRequests, windowMs);
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

      // Ensure a top-level user document exists for console visibility
      t.set(db.collection("users").doc(uid), {
        lastCreditUpdate: admin.firestore.FieldValue.serverTimestamp(),
        hasPurchased: true
      }, { merge: true });

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
      const uid = await verifyToken(req.headers.authorization);
      
      const snapshot = await db.collection(`users/${uid}/history`)
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();

      const banks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ banks });
    } catch (err: any) {
      if (err.message === "AUTH_MISSING" || err.message === "AUTH_INVALID") {
        return res.status(401).json({ error: "Authentication required" });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/community-library", async (req, res) => {
    try {
      const snapshot = await db.collection("community_library")
        .orderBy("timestamp", "desc")
        .limit(50)
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

      // Get host name from Firebase Auth
      const userRecord = await admin.auth().getUser(uid);
      const creatorName = userRecord.displayName || "Verified User";

      // Generate a unique 6-character alphanumeric code.
      let code = "";
      let attempts = 0;
      while (attempts < 5) {
        const candidate = Math.random().toString(36).substring(2, 8).toUpperCase();
        const existing = await db.collection("classrooms").doc(candidate).get();
        if (!existing.exists) {
          code = candidate;
          break;
        }
        attempts += 1;
      }

      if (!code) {
        return res.status(503).json({ error: "Unable to allocate classroom code. Try again." });
      }

      await db.collection("classrooms").doc(code).set({
        ...bank,
        creatorUid: uid,
        creatorName,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`[Host:Collab] uid=${uid} name=${creatorName} code=${code}`);
      res.json({ success: true, code });
    } catch (err: any) {
      if (err.message === "AUTH_MISSING" || err.message === "AUTH_INVALID") {
        return res.status(401).json({ error: "Authentication required" });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // ─── CLASSROOM: Join ───────────────────────────────────────────────────────
  app.post("/api/classroom/join", async (req, res) => {
    try {
      if (!(await enforceRateLimit(req, res, "classroom-join", 30, 60_000))) {
        return;
      }

      await verifyToken(req.headers.authorization);
      const code = String(req.body?.code || "").trim().toUpperCase();
      if (!code) return res.status(400).json({ error: "Code required" });
      if (!/^[A-Z0-9]{6}$/.test(code)) {
        return res.status(400).json({ error: "Invalid classroom code format" });
      }

      const classroomRef = db.collection("classrooms").doc(code);
      const doc = await classroomRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Classroom not found" });

      // Increment student count for the teacher dashboard
      await classroomRef.update({
        memberCount: admin.firestore.FieldValue.increment(1)
      }).catch(() => { });

      res.json({ success: true, ...doc.data() });
    } catch (err: any) {
      if (err.message === "AUTH_MISSING" || err.message === "AUTH_INVALID") {
        return res.status(401).json({ error: "Authentication required" });
      }
      res.status(500).json({ error: err.message });
    }
  });



  // ─── SECURE SCAN PIPELINE ─────────────────────────────────────────────────
  // Domain-first retrieval with adaptive top-up and open-web rescue only if floor is missed.
  app.post("/api/scan", async (req, res) => {
    let uid: string | null = null;

    try {
      // 1. Authenticate user
      uid = await verifyToken(req.headers.authorization);
    } catch (err: any) {
      console.warn(`[Auth:Fail] Method=${req.method} Path=${req.path} Reason=${err.message}`);
      return res.status(401).json({ error: "Authentication required or session expired" });
    }

    try {
      // 3. Atomically check and deduct 1 credit (skip in DRY_RUN)
      const profileRef = db.doc(`users/${uid}/profile/data`);
      if (String(process.env.DRY_RUN || "false").toLowerCase() !== "true") {
        try {
          await db.runTransaction(async (t) => {
            const doc = await t.get(profileRef);
            const credits = doc.exists ? (doc.data()?.credits || 0) : 0;
            if (credits <= 0) throw new Error("INSUFFICIENT_CREDITS");
            t.update(profileRef, { credits: credits - 1 });
          });
        } catch (err: any) {
          if (err.message === "INSUFFICIENT_CREDITS") {
            return res.status(402).json({ error: "Insufficient units. Please top up." });
          }
          console.error(`[Credits:Transaction:Fail] uid=${uid}`, err);
          throw err;
        }
      } else {
        console.log('[DryRun] Skipping credit deduction (DRY_RUN=true)');
      }

      const { images, topic, subject, exams, targetClass } = req.body;
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
      let cachedDocId: string | null = null;
      const isTopicOnly = imageList.length === 0;
      const cacheKey = getCacheKey(subjectLabel, topic || "", examList);

      if (isTopicOnly) {
        // 1. Try Exact Match First (Fastest/Cheapest)
        const cacheRef = db.collection("global_cache").doc(cacheKey);
        const cacheDoc = await cacheRef.get();
        if (cacheDoc.exists) {
          console.log(`[Cache:EXACT_HIT] key=${cacheKey}`);
          cachedData = cacheDoc.data();
          cachedDocId = cacheKey;
        } else {
          // 2. Try Semantic Match (Pinecone)
          console.log(`[Cache:SEMANTIC_PULL] topic="${topic}"`);
          const vector = await getTopicEmbedding(topic || "");
          const index = getPineconeIndex();
          if (vector && index) {
            const queryResponse = await index.query({
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
                cachedDocId = bestMatch.id;
              }
            }
          }
        }

        if (cachedData) {
          const cachedQuestions = Array.isArray(cachedData.questions) ? cachedData.questions.length : 0;
          const age = Date.now() - (cachedData.timestamp?.toMillis() || 0);

          if (cachedQuestions < CACHE_MIN_QUESTIONS) {
            console.warn(`[Cache:DISCARD_LOW_QUALITY] id=${cachedDocId || cacheKey} questions=${cachedQuestions}`);
            if (cachedDocId) {
              db.collection("global_cache").doc(cachedDocId).delete().catch(() => { });
            }
          } else if (age < CACHE_MAX_AGE_MS) {
            const scanResult = {
              topicDetected: cachedData.topicDetected,
              summary: cachedData.summary,
              keywords: cachedData.keywords || [],
              questions: cachedData.questions || [],
            };
            
            // Save to user's personal history so it appears in their library
            await saveToUserHistory(uid, scanResult, {
              subject: subjectLabel,
              exams: examList,
              targetClass: targetClass || "12",
              isCacheHit: true
            });

            return res.json({
              ...scanResult,
              isPopular: true
            });
          } else {
            console.log(`[Cache:STALE] id=${cachedDocId || cacheKey} ageMs=${age}`);
          }
        }
      }
      console.log(`[Cache:MISS] key=${cacheKey} topic="${topic}"`);

      const DRY_RUN = String(process.env.DRY_RUN || "false").toLowerCase() === "true";

      const geminiKey = process.env.GEMINI_API_KEY;
      const tavilyKey = process.env.TAVILY_API_KEY;
      if (!DRY_RUN && (!geminiKey || !tavilyKey)) {
        console.error("Missing API Keys: GEMINI_API_KEY or TAVILY_API_KEY not found in environment.");
        return res.status(500).json({ error: "Server API keys not configured." });
      }

      let ai: any;
      let tv: any;
      if (DRY_RUN) {
        console.log('[DryRun] Starting dry-run mode: AI and Tavily calls are stubbed.');
        ai = {
          models: {
            generateContent: async (config: any) => {
              const textParts: string[] = [];
              if (config?.contents) {
                const parts = Array.isArray(config.contents.parts) ? config.contents.parts : [config.contents];
                for (const p of parts) {
                  if (!p) continue;
                  if (typeof p === 'string') textParts.push(p);
                  else if (typeof p.text === 'string') textParts.push(p.text);
                }
              }
              const joined = textParts.join('\n').toLowerCase();

              // Analysis / query generation
              if (joined.includes('brainstorm search queries') || joined.includes('generate 6 to 8 highly targeted search queries')) {
                return { text: JSON.stringify({ topicDetected: 'Dry Topic', summary: 'Dry summary', keywords: ['dry'], searchQueries: [ 'dry query 1', 'dry query 2', 'dry query 3' ] }) };
              }

              // Rescue rewrite
              if (joined.includes('you are rewriting search queries') || joined.includes('rewriting search queries')) {
                return { text: JSON.stringify({ searchQueries: [ 'dry rescue query 1', 'dry rescue query 2', 'dry rescue query 3' ] }) };
              }

              // Structuring / generate questions
              if (joined.includes('extract and organize') || joined.includes('generate between 25 and 35 questions') || joined.includes('create high-quality original practice questions')) {
                const questions = [];
                for (let i = 1; i <= 20; i++) {
                  questions.push({ text: `Dry question ${i}`, options: ['A', 'B', 'C', 'D'], answer: 'A', source: 'Practice Dry Set', year: '2025', type: 'Practice', targetExam: 'DryExam', topic: 'Dry Topic' });
                }
                return { text: JSON.stringify({ questions }) };
              }

              // Top-up / rescue small generation
              if (joined.includes('generate') && joined.includes('additional') && joined.includes('questions')) {
                const questions = [];
                for (let i = 1; i <= 6; i++) {
                  questions.push({ text: `Dry topup question ${i}`, options: ['A', 'B', 'C', 'D'], answer: 'A', source: 'Practice Dry Topup', year: '2025', type: 'Practice', targetExam: 'DryExam', topic: 'Dry Topic' });
                }
                return { text: JSON.stringify({ questions }) };
              }

              // JSON repair fallback
              if (joined.includes('you are a json repair utility')) {
                return { text: JSON.stringify({ questions: [] }) };
              }

              // Default
              return { text: JSON.stringify({ topicDetected: 'Dry Default', summary: 'Dry fallback', keywords: [], searchQueries: [ 'dry default query' ] }) };
            }
          }
        };

        tv = {
          search: async (q: string, opts: any) => {
            // Return a small set of fake results
            const results = [];
            for (let i = 1; i <= 3; i++) {
              results.push({ url: `https://dry.example.com/doc${i}`, content: `Sample snippet for ${q} - doc ${i}`, usage: { credits: 1 } });
            }
            return { results, usage: { credits: results.length } };
          }
        };
      } else {
        ai = new GoogleGenAI({ apiKey: geminiKey });
        tv = tavily({ apiKey: tavilyKey });
      }
      let geminiCallCount = 0;

      const generateWithRetry = (config: any) =>
        withRetry(() => {
          geminiCallCount += 1;
          return ai.models.generateContent(config);
        });

      // Tracking for adaptive rescue and domain prioritization
      let usedQueries: string[] = [];
      const usedDomains = new Set<string>();
      const domainYield: Record<string, number> = {};

      // Dry-run / instrumentation metrics (populated during a scan)
      const metrics: any = {
        scan_start_ts: Date.now(),
        timers: {
          search_start: 0,
          search_end: 0,
          structuring_start: 0,
          structuring_end: 0,
          rescue_start: 0,
          rescue_end: 0,
        },
        dedupe_rejections: 0,
        topup_attempts: 0,
        topup_added: 0,
        rescue_added: 0,
        json_repair_attempts: 0,
        initial_source_count: 0,
        rescue_seen_count: 0,
        final_unique_source_count: 0,
        rescue_type: 'none',
        rescue_queries: [],
        rescue_used: false,
        top_domains: [],
      };

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
            `Target Class: ${targetClass || "12"}.`,
            `Subject: ${subjectLabel}. Topics provided: "${topic}".`,
            "",
            "STEP 1 — Brainstorm Search Queries:",
            "Based on the provided academic level and topics, generate 6 to 8 highly targeted search queries to find real exam questions.",
            "Distribute the topics across the queries and use synonyms to widen retrieval.",
            `Examples: ${subjectLabel} ${primaryExam} previous year questions ${topic}`,
            `Examples: ${subjectLabel} ${primaryExam} solved MCQ sample paper ${topic}`,
            `Examples: ${subjectLabel} HOTS assertion reason questions ${topic} ${allExams}`,
          ].join("\n");

          const response = await generateWithRetry({
              model: GEMINI_GENERATION_MODEL,
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
            });
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
            "STEP 2 — Generate 4-6 diverse search queries:",
            "Distribute the detected topics across the queries so each query is specific and targeted.",
            "Do NOT dump all topics into a single query — that dilutes results.",
            `Prefer 4-6 concise queries. Examples of good formats:`,
            `- (mainTopic1 OR mainTopic2) ${subjectLabel} ${primaryExam} PYQ past year questions with solutions`,
            `- (nextTopic1 OR nextTopic2) ${subjectLabel} ${primaryExam} sample paper MCQ questions`,
            `- (remainingTopic1 OR remainingTopic2) ${subjectLabel} HOTS important questions ${allExams}`,
            "Include synonyms and common exam phrasing to improve recall across sources.",
          ].join("\n");

          const analysisResponse = await generateWithRetry({
              model: GEMINI_GENERATION_MODEL,
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
            });
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

      const topicSeed = String(analysis.topicDetected || topic || subjectLabel).trim();
      const rawQueries = (analysis.searchQueries || []).slice(0, 6);
      const aiQueries = rawQueries.filter((q: string) => q && q.trim().length > 0);
      const fallbackQueries = [
        `${subjectLabel} ${primaryExam} previous year questions ${topicSeed}`,
        `${subjectLabel} ${primaryExam} solved MCQ ${topicSeed}`,
        `${subjectLabel} important questions ${topicSeed} ${allExams}`,
      ];
      const includeDomains = getIncludeDomains(examList, subjectLabel, targetClass);
      const domainScoped = Array.isArray(includeDomains) ? includeDomains.slice(0, 80) : [];

      const fallbackCreditPerRequest = TAVILY_SEARCH_DEPTH === "advanced" ? 2 : 1;
      const estimatedInrPerRequest = fallbackCreditPerRequest * TAVILY_CREDIT_USD * USD_TO_INR;
      const tavilyBudgetInr = Math.max(0.3, MAX_SCAN_COST_INR - GEMINI_COST_BUFFER_INR);
      const budgetedQueryCap = Math.max(1, Math.floor(tavilyBudgetInr / estimatedInrPerRequest));
      const effectiveQueryCap = Math.max(1, Math.min(MAX_TAVILY_QUERIES, budgetedQueryCap));

      const queries = Array.from(new Set([...aiQueries, ...fallbackQueries])).slice(0, effectiveQueryCap);
      const allSearchResults: any[] = [];
      let tavilyRequestCount = 0;

      const runSearchBatch = async (batchQueries: string[], useDomains: boolean, overrideDomains?: string[]) => {
        if (batchQueries.length === 0) return;
        // Track queries executed
        usedQueries.push(...batchQueries);

        const includeDomainsOpt = useDomains && ((overrideDomains && overrideDomains.length > 0) || domainScoped.length > 0)
          ? (overrideDomains && overrideDomains.length > 0 ? overrideDomains : domainScoped)
          : undefined;

        const tasks = batchQueries.map((q) =>
          tv.search(q, {
            searchDepth: TAVILY_SEARCH_DEPTH,
            maxResults: TAVILY_MAX_RESULTS,
            ...(includeDomainsOpt ? { includeDomains: includeDomainsOpt } : {}),
          }).catch((err) => {
            console.error(`Tavily search failed: ${q}`, err?.message || err);
            return { results: [] };
          })
        );

        const batchResults = await Promise.all(tasks);
        allSearchResults.push(...batchResults);
        tavilyRequestCount += batchQueries.length;

        // Update per-domain yield statistics
        for (const sr of batchResults) {
          for (const r of (sr.results || [])) {
            const url = String(r?.url || "").trim();
            if (!url) continue;
            try {
              const hostname = new URL(url).hostname.replace(/^www\./, "");
              usedDomains.add(hostname);
              domainYield[hostname] = (domainYield[hostname] || 0) + 1;
            } catch (e) {
              // ignore malformed URLs
            }
          }
        }
      };

      // MARK: search phase start
      metrics.timers.search_start = Date.now();
      await runSearchBatch(queries, true);

      const countUniqueSources = (results: any[]) => {
        const seen = new Set<string>();
        for (const sr of results) {
          for (const r of (sr?.results || [])) {
            const url = String(r?.url || "").trim();
            const content = String(r?.content || "").trim();
            if (!url || !content) continue;
            seen.add(url);
          }
        }
        return seen.size;
      };

      const initialSourceCount = countUniqueSources(allSearchResults);
      if (initialSourceCount < MIN_STRUCTURED_SOURCES) {
        const remainingBudgetQueries = Math.max(0, budgetedQueryCap - tavilyRequestCount);
        const supplementalCap = Math.min(SUPPLEMENTAL_TAVILY_QUERIES, remainingBudgetQueries);
        if (supplementalCap > 0) {
          const supplementalQueries = Array.from(new Set([
            `${subjectLabel} ${primaryExam} ${topicSeed} mcq with answers`,
            `${subjectLabel} ${primaryExam} assertion reason questions ${topicSeed}`,
            `${subjectLabel} ${targetClass || "12"} ${topicSeed} sample paper solved questions`,
            `${subjectLabel} ${allExams} important ${topicSeed} practice questions`,
          ]))
            .filter((q) => !queries.includes(q))
            .slice(0, supplementalCap);

          if (supplementalQueries.length > 0) {
            console.log(
              `[Scan] low source coverage=${initialSourceCount}, running supplemental Tavily queries=${supplementalQueries.length}`
            );
            // Keep supplemental retrieval domain-scoped for the active context.
            // Prioritize unseen/low-yield domains first to maximize new coverage.
            const prioritizedDomains = domainScoped.slice().sort((a, b) => {
              const aCount = domainYield[a] || 0;
              const bCount = domainYield[b] || 0;
              return aCount - bCount;
            });
            await runSearchBatch(supplementalQueries, true, prioritizedDomains.slice(0, 80));
          }
        }
      }

      let tavilyCreditsUsed = allSearchResults.reduce((sum, sr) => {
        const reported = Number((sr as any)?.usage?.credits || 0);
        return sum + (reported > 0 ? reported : fallbackCreditPerRequest);
      }, 0);

      const seenUrls = new Set<string>();
      const combined: string[] = [];
      let totalChars = 0;
      const MAX_SOURCES_FOR_STRUCTURING = 32;
      const MAX_COMBINED_CHARS = 65000;
      for (const sr of allSearchResults) {
        for (const r of (sr.results || [])) {
          if (!seenUrls.has(r.url)) {
            seenUrls.add(r.url);
            const snippet = (r.content || "").slice(0, 1600).trim();
            if (!snippet) continue;
            const sourceBlock = `[Source: ${r.url}]\n${snippet}`;
            if (combined.length >= MAX_SOURCES_FOR_STRUCTURING) break;
            if (totalChars + sourceBlock.length > MAX_COMBINED_CHARS) break;
            combined.push(sourceBlock);
            totalChars += sourceBlock.length;
          }
        }
        if (combined.length >= MAX_SOURCES_FOR_STRUCTURING || totalChars >= MAX_COMBINED_CHARS) break;
      }
      console.log(`[Scan] ${combined.length} unique sources found`);
      // MARK: search phase end
      metrics.timers.search_end = Date.now();

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
        `- Generate between 25 and 35 questions. Minimum 12 required. Stay within ${subjectLabel}: "${analysis.topicDetected}".`,
        "- If the search results do not contain enough questions, supplement with your EXPERT knowledge of exam-style questions for this topic — you MUST reach at least 12 questions.",
        "",
        combined.length > 0 ? `Search Results:\n${combined.join("\n---\n")}` : "No search results available. Proceed with expert generation.",
      ].join("\n");

      // MARK: structuring phase start
      metrics.timers.structuring_start = Date.now();
      const structureResponse = await generateWithRetry({
          model: GEMINI_GENERATION_MODEL,
          contents: structurePrompt,
          config: {
            maxOutputTokens: 8192,
            temperature: 0.1,
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
                      targetExam: { type: Type.STRING },
                      topic: { type: Type.STRING },
                    },
                    required: ["text", "options", "answer"],
                  },
                },
              },
              required: ["questions"],
            },
          },
        });

      let structuredText = "";
      try {
        structuredText = structureResponse.text || "";
      } catch (err: any) {
        console.error("Gemini Structuring Error:", err);
        await profileRef.update({ credits: admin.firestore.FieldValue.increment(1) }).catch(() => { });
        return res.status(500).json({ error: `Question structuring failed: ${err.message}` });
      }

      const normalizeQuestion = (raw: any) => {
        if (!raw || typeof raw !== "object") return null;

        const rawText = String(raw.text || raw.question || "").trim();
        if (!rawText) return null;

        let options = Array.isArray(raw.options)
          ? raw.options.filter((opt: any) => typeof opt === "string" && opt.trim().length > 0).map((opt: string) => opt.trim())
          : [];

        const optionFillers = ["Option A", "Option B", "Option C", "Option D"];
        if (options.length < 4) {
          while (options.length < 4) options.push(optionFillers[options.length]);
        }
        if (options.length > 4) options = options.slice(0, 4);

        const answer = String(raw.answer || options[0] || "Option A").trim();
        const cleanedSource = String(raw.source || "")
          .replace(/https?:\/\/[^\s]+/g, "")
          .trim() || "Standard Practice Question";
        const rawType = String(raw.type || "Practice").trim();
        const normalizedType = ["PYQ", "Sample Paper", "HOTS", "Practice"].includes(rawType)
          ? rawType
          : "Practice";

        return {
          text: rawText,
          options,
          answer,
          source: cleanedSource,
          year: String(raw.year || new Date().getFullYear()),
          type: normalizedType,
          targetExam: String(raw.targetExam || primaryExam || "General"),
          topic: String(raw.topic || analysis.topicDetected || topicSeed || "General"),
        };
      };

      let structured: any = {};
      try {
        if (!structuredText) throw new Error("Empty AI response");
        structured = JSON.parse(structuredText);
      } catch (err: any) {
        console.warn("[Scan:StructuringError] Initial parse failed, attempting repair", err?.message || err);
        try {
          const repairPrompt = [
            "You are a JSON repair utility.",
            "Fix the malformed JSON below and return valid JSON only.",
            "Required shape: { questions: [{ text, options[4], answer, source, year, type, targetExam, topic }] }",
            "Do not add markdown or explanations.",
            "Malformed JSON:",
            structuredText.slice(0, 25000),
          ].join("\n");

          metrics.json_repair_attempts += 1;
          const repaired = await generateWithRetry({
              model: GEMINI_GENERATION_MODEL,
              contents: repairPrompt,
              config: {
                maxOutputTokens: 8192,
                temperature: 0,
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
                          targetExam: { type: Type.STRING },
                          topic: { type: Type.STRING },
                        },
                        required: ["text", "options", "answer"],
                      },
                    },
                  },
                  required: ["questions"],
                },
              },
            });

          structured = JSON.parse(repaired.text || "{}");
        } catch (repairErr: any) {
          console.error("[Scan:StructuringError] Repair failed", repairErr, "Raw:", structuredText);
          await profileRef.update({ credits: admin.firestore.FieldValue.increment(1) }).catch(() => { });
          return res.status(500).json({ error: "AI structuring format error. Credits refunded. Please try again." });
        }
      }

      const dedupeSet = new Set<string>();
      const initialQuestions = Array.isArray(structured.questions) ? structured.questions : [];
      const normalizedInitial: any[] = [];
      for (const q of initialQuestions) {
        const normalized = normalizeQuestion(q);
        if (!normalized) continue;
        const normText = normalized.text.toLowerCase().replace(/\s+/g, " ").trim();
        if (!normText) continue;
        if (dedupeSet.has(normText)) {
          metrics.dedupe_rejections += 1;
          continue;
        }
        dedupeSet.add(normText);
        normalizedInitial.push(normalized);
      }
      structured.questions = normalizedInitial;

      console.log(`[Scan] Extracted ${structured.questions?.length || 0} unique questions`);
      // MARK: structuring phase end
      metrics.timers.structuring_end = Date.now();

      // Keep the enforced question floor with minimal-cost top-up.
      const MIN_QUESTIONS = 12;
      const MAX_QUESTIONS = 35;
      const TARGET_QUESTIONS = MIN_QUESTIONS;

      for (let attempt = 0; attempt < MAX_TOPUP_ATTEMPTS && (structured.questions?.length || 0) < TARGET_QUESTIONS; attempt += 1) {
        // Track top-up attempts for diagnostics
        metrics.topup_attempts += 1;
        const currentCount = structured.questions?.length || 0;
        const missingCount = TARGET_QUESTIONS - currentCount;
        const requestCount = Math.min(12, Math.max(6, missingCount + 2));

        const existingQuestionTexts = (structured.questions || [])
          .map((q: any) => q?.text)
          .filter((t: any) => typeof t === "string")
          .slice(0, 40);

        const topUpPrompt = [
          `Generate ${requestCount} additional unique ${subjectLabel} questions for topic: \"${analysis.topicDetected || topicSeed}\".`,
          "Rules:",
          "- Return JSON only in the required schema.",
          "- Exactly 4 options per question.",
          "- Provide answer, source text (no URL), year, type, targetExam, topic.",
          "- Use varied question styles: conceptual, numerical, assertion-reason, and application.",
          "- Do not repeat any existing questions listed below.",
          `Existing questions to avoid:\n${existingQuestionTexts.join("\n") || "None"}`,
        ].join("\n");

        try {
          const topUpResponse = await generateWithRetry({
              model: GEMINI_GENERATION_MODEL,
              contents: topUpPrompt,
              config: {
                maxOutputTokens: 4096,
                temperature: 0.2,
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
                          targetExam: { type: Type.STRING },
                          topic: { type: Type.STRING },
                        },
                        required: ["text", "options", "answer"],
                      },
                    },
                  },
                  required: ["questions"],
                },
              },
            });

          let parsedTopUp: any = {};
          try {
            parsedTopUp = JSON.parse(topUpResponse.text || "{}");
          } catch (topUpParseErr: any) {
            try {
              const repairPrompt = [
                "You are a JSON repair utility.",
                "Fix the malformed JSON below and return valid JSON only.",
                "Required shape: { questions: [{ text, options[4], answer, source, year, type, targetExam, topic }] }",
                "Do not add markdown or explanations.",
                "Malformed JSON:",
                String(topUpResponse.text || "").slice(0, 20000),
              ].join("\n");

              metrics.json_repair_attempts += 1;
              const repaired = await generateWithRetry({
                model: GEMINI_GENERATION_MODEL,
                contents: repairPrompt,
                config: {
                  maxOutputTokens: 4096,
                  temperature: 0,
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
                            targetExam: { type: Type.STRING },
                            topic: { type: Type.STRING },
                          },
                          required: ["text", "options", "answer"],
                        },
                      },
                    },
                    required: ["questions"],
                  },
                },
              });
              parsedTopUp = JSON.parse(repaired.text || "{}");
            } catch (repairErr: any) {
              console.warn("[Scan:TopUp] JSON repair failed", topUpParseErr?.message || topUpParseErr, repairErr?.message || repairErr);
              parsedTopUp = {};
            }
          }

          const topUpQuestions = Array.isArray(parsedTopUp.questions) ? parsedTopUp.questions : [];

          for (const raw of topUpQuestions) {
            const normalized = normalizeQuestion(raw);
            if (!normalized) continue;
            const normText = normalized.text.toLowerCase().replace(/\s+/g, " ").trim();
            if (!normText) continue;
            if (dedupeSet.has(normText)) {
              metrics.dedupe_rejections += 1;
              continue;
            }
            dedupeSet.add(normText);
            structured.questions.push(normalized);
            metrics.topup_added += 1;
            if (structured.questions.length >= TARGET_QUESTIONS) break;
          }
        } catch (topUpErr) {
          console.warn("[Scan:TopUp] Could not top-up questions", topUpErr);
        }
      }

      if ((structured.questions?.length || 0) < MIN_QUESTIONS) {
        // If domain-scoped retrieval was insufficient, do one open-web rescue pass
        // before failing the scan.
        const missingCount = MIN_QUESTIONS - (structured.questions?.length || 0);

        // Attempt to generate a non-repetitive rescue query set via Gemini
        let rescueQueries: string[] = [];
        try {
          const rewritePrompt = [
            `You are rewriting search queries to FIND additional real exam questions for the given topic.`,
            `Subject: ${subjectLabel}`,
            `Topic: ${analysis.topicDetected || topicSeed}`,
            `Exams: ${allExams}`,
            "Goal: produce up to 3 concise, high-yield search queries that prioritize unseen or low-yield domains.",
            "Constraints:",
            "- Do NOT repeat the existing query templates.",
            "- Prioritize domains not seen in the current scan; de-prioritize domains with low yield.",
            "- Return only JSON in the format: { searchQueries: [ ... ] }",
            "- Do NOT include URLs.",
            "Existing executed queries (last 20):",
            (usedQueries.slice(-20).join("\n") || "None"),
            "Seen domains (sample):",
            (Array.from(usedDomains).slice(0, 20).join(", ") || "None"),
            `Per-domain yields: ${JSON.stringify(domainYield)}`,
          ].join("\n");

          const rewriteResp = await generateWithRetry({
            model: GEMINI_GENERATION_MODEL,
            contents: { parts: [{ text: rewritePrompt }] },
            config: {
              maxOutputTokens: 1024,
              temperature: 0.2,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  searchQueries: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["searchQueries"],
              },
            },
          });

          try {
            const parsed = JSON.parse(rewriteResp.text || "{}");
            if (Array.isArray(parsed.searchQueries)) {
              rescueQueries = parsed.searchQueries.map((s: any) => String(s || "").trim()).filter((s: string) => s.length > 0).slice(0, 3);
            }
          } catch (e) {
            // fall through to fallback
          }
        } catch (err) {
          console.warn("[Scan:RescueRewrite] Could not generate rescue queries", err?.message || err);
          rescueQueries = [];
        }

        // Fallback to conservative rescue queries if rewrite failed
        if (!Array.isArray(rescueQueries) || rescueQueries.length === 0) {
          rescueQueries = Array.from(new Set([
            `${subjectLabel} ${primaryExam} ${topicSeed} previous year MCQ with solutions`,
            `${subjectLabel} ${topicSeed} assertion reason questions with answers`,
            `${subjectLabel} ${targetClass || "12"} ${topicSeed} important questions`,
            `${subjectLabel} ${allExams} ${topicSeed} sample paper solved questions`,
          ])).slice(0, 3);
        }

        console.log(
          `[Scan:Rescue] Question floor miss=${structured.questions?.length || 0}. Running open-web rescue queries=${rescueQueries.length}`
        );

        const rescueResults = await Promise.all(
          rescueQueries.map((q) =>
            tv.search(q, {
              searchDepth: "basic",
              maxResults: Math.min(20, Math.max(TAVILY_MAX_RESULTS, 12)),
            }).catch((err) => {
              console.error(`[Scan:Rescue] Tavily failed for query=${q}`, err?.message || err);
              return { results: [] };
            })
          )
        );

        // Track rescue queries as used and update per-domain yields
        usedQueries.push(...rescueQueries);
        for (const sr of rescueResults) {
          for (const r of (sr.results || [])) {
            const url = String(r?.url || "").trim();
            if (!url) continue;
            try {
              const hostname = new URL(url).hostname.replace(/^www\./, "");
              usedDomains.add(hostname);
              domainYield[hostname] = (domainYield[hostname] || 0) + 1;
            } catch (e) {
              // ignore malformed urls
            }
          }
        }

        tavilyRequestCount += rescueQueries.length;
        tavilyCreditsUsed += rescueResults.reduce((sum, sr) => {
          const reported = Number((sr as any)?.usage?.credits || 0);
          return sum + (reported > 0 ? reported : 1);
        }, 0);

        const rescueSeen = new Set<string>();
        const rescueCombined: string[] = [];
        let rescueChars = 0;
        const MAX_RESCUE_SOURCES = 20;
        const MAX_RESCUE_CHARS = 36000;

        for (const sr of rescueResults) {
          for (const r of (sr.results || [])) {
            const url = String(r?.url || "").trim();
            if (!url || seenUrls.has(url) || rescueSeen.has(url)) continue;
            const snippet = String(r?.content || "").slice(0, 1400).trim();
            if (!snippet) continue;
            rescueSeen.add(url);
            const sourceBlock = `[Source: ${url}]\n${snippet}`;
            if (rescueCombined.length >= MAX_RESCUE_SOURCES) break;
            if (rescueChars + sourceBlock.length > MAX_RESCUE_CHARS) break;
            rescueCombined.push(sourceBlock);
            rescueChars += sourceBlock.length;
          }
          if (rescueCombined.length >= MAX_RESCUE_SOURCES || rescueChars >= MAX_RESCUE_CHARS) break;
        }

        if (rescueCombined.length > 0) {
          const existingQuestionTexts = (structured.questions || [])
            .map((q: any) => q?.text)
            .filter((t: any) => typeof t === "string")
            .slice(0, 50);

          const rescuePrompt = [
            `Use the open-web results below to generate ${Math.min(12, Math.max(6, missingCount + 2))} additional unique ${subjectLabel} questions for \"${analysis.topicDetected || topicSeed}\".`,
            "Rules:",
            "- Return JSON only in the required schema.",
            "- Exactly 4 options per question.",
            "- Provide answer, source text (no URL), year, type, targetExam, topic.",
            "- Do not repeat existing questions.",
            `Existing questions to avoid:\n${existingQuestionTexts.join("\n") || "None"}`,
            `Open-web sources:\n${rescueCombined.join("\n---\n")}`,
          ].join("\n");

          try {
            const rescueResponse = await generateWithRetry({
              model: GEMINI_GENERATION_MODEL,
              contents: rescuePrompt,
              config: {
                maxOutputTokens: 4096,
                temperature: 0.2,
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
                          targetExam: { type: Type.STRING },
                          topic: { type: Type.STRING },
                        },
                        required: ["text", "options", "answer"],
                      },
                    },
                  },
                  required: ["questions"],
                },
              },
            });

            let parsedRescue: any = {};
            try {
              parsedRescue = JSON.parse(rescueResponse.text || "{}");
            } catch (rescueParseErr: any) {
              try {
                const repairPrompt = [
                  "You are a JSON repair utility.",
                  "Fix the malformed JSON below and return valid JSON only.",
                  "Required shape: { questions: [{ text, options[4], answer, source, year, type, targetExam, topic }] }",
                  "Do not add markdown or explanations.",
                  "Malformed JSON:",
                  String(rescueResponse.text || "").slice(0, 20000),
                ].join("\n");

                const repaired = await generateWithRetry({
                  model: GEMINI_GENERATION_MODEL,
                  contents: repairPrompt,
                  config: {
                    maxOutputTokens: 4096,
                    temperature: 0,
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
                              targetExam: { type: Type.STRING },
                              topic: { type: Type.STRING },
                            },
                            required: ["text", "options", "answer"],
                          },
                        },
                      },
                      required: ["questions"],
                    },
                  },
                });
                parsedRescue = JSON.parse(repaired.text || "{}");
              } catch (repairErr: any) {
                console.warn("[Scan:Rescue] JSON repair failed", rescueParseErr?.message || rescueParseErr, repairErr?.message || repairErr);
                parsedRescue = {};
              }
            }

            const rescueQuestions = Array.isArray(parsedRescue.questions) ? parsedRescue.questions : [];
            for (const raw of rescueQuestions) {
              const normalized = normalizeQuestion(raw);
              if (!normalized) continue;
              const normText = normalized.text.toLowerCase().replace(/\s+/g, " ").trim();
              if (!normText || dedupeSet.has(normText)) continue;
              dedupeSet.add(normText);
              structured.questions.push(normalized);
              if (structured.questions.length >= MIN_QUESTIONS) break;
            }
          } catch (rescueErr) {
            console.warn("[Scan:Rescue] Could not complete open-web rescue", rescueErr);
          }
        }
      }

      if ((structured.questions?.length || 0) < MIN_QUESTIONS) {
        console.warn(`[Scan] Question floor not met even after open-web rescue: ${structured.questions?.length || 0}. Refunding credit.`);
        await profileRef.update({ credits: admin.firestore.FieldValue.increment(1) }).catch(() => { });
        return res.status(503).json({ error: `Could not generate the minimum ${MIN_QUESTIONS} questions right now. Credit refunded. Please retry.` });
      }

      if (Array.isArray(structured.questions) && structured.questions.length > MAX_QUESTIONS) {
        structured.questions = structured.questions.slice(0, MAX_QUESTIONS);
      }

      const finalResult = {
        topicDetected: analysis.topicDetected || topic,
        summary: analysis.summary,
        keywords: analysis.keywords || [],
        questions: structured.questions || [],
      };

      // When in DRY_RUN, include diagnostics and internal metrics for easier local metrics collection
      if (String(process.env.DRY_RUN || "false").toLowerCase() === "true") {
        try {
          (finalResult as any).diagnostics = {
            geminiCalls: geminiCallCount,
            tavilyRequests: tavilyRequestCount,
            tavilyCredits: tavilyCreditsUsed || 0,
            // include the internal metrics object and useful tracking vars
            metrics,
            usedQueries,
            usedDomains: Array.from(usedDomains || []),
            domainYield: domainYield || {},
          };
        } catch (e) {
          // best-effort: don't fail the request if diagnostics serialization trips
          (finalResult as any).diagnostics = {
            geminiCalls: geminiCallCount,
            tavilyRequests: tavilyRequestCount,
            tavilyCredits: tavilyCreditsUsed || 0,
            diagnostics_error: String(e?.message || e),
          };
        }
      }

      console.log(
        `[Scan:Cost] uid=${uid} geminiCalls=${geminiCallCount} tavilyRequests=${tavilyRequestCount} tavilyCredits=${tavilyCreditsUsed} depth=${TAVILY_SEARCH_DEPTH} maxQueries=${effectiveQueryCap} budgetInr=${MAX_SCAN_COST_INR.toFixed(2)} estInrPerReq=${estimatedInrPerRequest.toFixed(2)}`
      );

      // NOTE: automatic verification on assistant replies has been removed.
      // The system will no longer block or annotate responses here.
      // Verification is preserved only for gating Knowledge Map cache saves below.

      // Save to user history on the backend for reliability
      await saveToUserHistory(uid, finalResult, {
        subject: subjectLabel,
        exams: examList,
        targetClass: targetClass || "12",
        isCacheHit: false
      });

      res.json(finalResult);

      // ─── SAVE TO CACHE (Hybrid Firestore + Pinecone) ─────────────────────
      if ((structured.questions?.length || 0) >= CACHE_MIN_QUESTIONS) {
        // Gate cache/discovery/pinecone saves behind a verifier to ensure only
        // high-quality reports enter the Knowledge Map.
        let passVerification = true;
        try {
          const replyText = [finalResult.summary || '', ...(finalResult.questions || []).map((q: any) => q?.text || '')].join('\n\n');
          const verification = await verifyTextInProcess(replyText);
          passVerification = verification.ok;
          if (!passVerification) {
            console.warn(`[Verifier:CacheSkip] uid=${uid} cacheKey=${cacheKey} issues=${(verification.report?.unsupported || []).length}`);
          }
        } catch (verErr) {
          // On verifier failure, treat as pass to avoid accidental data loss.
          console.error('[Verifier] cache verification error, allowing save', verErr);
          passVerification = true;
        }

        if (!passVerification) {
          console.log(`[Cache] Skipping Knowledge Map save for key=${cacheKey} due to verification failure.`);
        } else {
          // Save to Firestore (Anonymized)
          db.collection("global_cache").doc(cacheKey).set({
            topicDetected: analysis.topicDetected || topic,
            summary: analysis.summary,
            keywords: analysis.keywords || [],
            questions: structured.questions,
            subject: subjectLabel,
            exams: examList,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          }).catch(err => console.error("[Cache:SaveError:Firestore]", err));

          // Save keywords to discovery collection for the Knowledge Map
          const keywords = analysis.keywords || [];
          keywords.forEach((kw: string) => {
            const kwId = kw.toLowerCase().replace(/\s+/g, "_");
            db.collection("discovery").doc(kwId).set({
              name: kw,
              type: "keyword",
              subject: subjectLabel,
              lastSeen: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).catch(() => { });

            // Link keyword to this topic
            db.collection("discovery").doc(`${kwId}_${cacheKey}`).set({
              source: kwId,
              target: cacheKey,
              type: "link",
              timestamp: admin.firestore.FieldValue.serverTimestamp()
            }).catch(() => { });
          });

          // Save to Pinecone
          (async () => {
            const vector = await getTopicEmbedding(analysis.topicDetected || topic);
            if (vector) {
              await pcIndex.upsert({
                records: [{
                  id: cacheKey,
                  values: vector,
                  metadata: {
                    topicDetected: analysis.topicDetected || topic,
                    subject: subjectLabel
                  }
                }]
              });
            }
          })().catch(err => console.error("[Cache:SaveError:Pinecone]", err));
        }
      } else {
        console.log(`[Cache:SKIP_LOW_QUALITY] key=${cacheKey} questions=${structured.questions?.length || 0}`);
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
      // 1. Fetch latest 100 discoveries from global_cache (the true "Search Graph")
      const cacheSnap = await db.collection("global_cache")
        .orderBy("timestamp", "desc")
        .limit(100)
        .get();

      const nodeMap = new Map();
      const links: any[] = [];
      const nodes: any[] = [];

      cacheSnap.docs.forEach(doc => {
        const data = doc.data();
        const id = doc.id;
        const topic = data.topicDetected || data.topic || "Discovery";
        const subject = data.subject || "General";
        const keywords = Array.isArray(data.keywords) ? data.keywords : [];

        if (!nodeMap.has(id)) {
          const mainNode = {
            id,
            name: topic,
            group: subject,
            value: 8, // Larger for main topics
            keywords: keywords,
            type: "topic"
          };
          nodeMap.set(id, mainNode);
          nodes.push(mainNode);
        }
      });

      // 2. Add keywords from discovery collection for granular nodes
      const discoverySnap = await db.collection("discovery")
        .where("type", "==", "keyword")
        .limit(200)
        .get();

      discoverySnap.docs.forEach(doc => {
        const data = doc.data();
        const id = doc.id;
        if (!nodeMap.has(id)) {
          const kwNode = {
            id,
            name: data.name,
            group: data.subject || "General",
            value: 2, // Smaller for keywords
            type: "keyword"
          };
          nodeMap.set(id, kwNode);
          nodes.push(kwNode);
        }
      });

      // 3. Add links from discovery collection
      const linksSnap = await db.collection("discovery")
        .where("type", "==", "link")
        .limit(300)
        .get();

      linksSnap.docs.forEach(doc => {
        const data = doc.data();
        if (nodeMap.has(data.source) && nodeMap.has(data.target)) {
          links.push({
            source: data.source,
            target: data.target,
            value: 1,
            type: "discovery-link"
          });
        }
      });

      // 4. Fallback cross-link nodes based on shared subject
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          if (n1.type === "topic" && n2.type === "topic" && n1.group === n2.group) {
            links.push({ source: n1.id, target: n2.id, value: 0.5, type: "subject-link" });
          }
        }
      }

      res.json({ nodes, links });
    } catch (err) {
      console.error("[GraphData:Error]", err);
      res.status(500).json({ error: "Failed to fetch map data" });
    }
  });


  // ─── Admin Migration Endpoint (One-time use) ──────────────────────────────────
  app.post("/api/admin/backfill", async (req, res) => {
    try {
      // Verify admin token or secret
      const adminSecret = process.env.ADMIN_SECRET;
      const authHeader = req.headers.authorization;
      
      // Check for valid admin authentication
      let isAdmin = false;
      
      // Method 1: Admin secret in header
      if (adminSecret && authHeader === `Bearer ${adminSecret}`) {
        isAdmin = true;
      }
      
      // Method 2: Firebase ID token with admin claim
      if (!isAdmin && authHeader) {
        try {
          const uid = await verifyToken(authHeader);
          const userRecord = await admin.auth().getUser(uid);
          isAdmin = userRecord.customClaims?.admin === true;
        } catch {
          isAdmin = false;
        }
      }
      
      if (!isAdmin) {
        console.warn("[Admin:Unauthorized] Backfill attempt without proper auth");
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

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
          await pcIndex.upsert({
            records: [{
              id,
              values: vector,
              metadata: { topicDetected: topic, subject }
            }]
          });
          vectorizedCount++;
        }
      }
      console.log(`[Admin:Backfill:Complete] Processed ${snap.size} items, vectorized ${vectorizedCount}`);
      res.json({ success: true, processed: snap.size, vectorized: vectorizedCount });
    } catch (err) {
      console.error("[Admin:Backfill:Error]", err);
      res.status(500).json({ error: "Backfill failed" });
    }
  });

  // Verify assistant reply endpoint — runs the verifier script and returns report.
  app.post("/api/verify-response", async (req, res) => {
    try {
      if (!(await enforceRateLimit(req, res, "verify-response", 20, 60_000))) {
        return;
      }

      const text = req.body?.text;
      if (typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "Missing text body (text)" });
      }
      if (text.length > 25_000) {
        return res.status(413).json({ error: "Input too large. Maximum 25000 characters allowed." });
      }

      // Try in-process verifier first for lower latency
      try {
        const result = await verifyTextInProcess(text);
        return res.status(200).json({ ok: result.ok, code: result.ok ? 0 : 1, report: result.report, source: 'in-process' });
      } catch (inErr) {
        console.warn('[verifier] in-process failed, falling back to child process', inErr?.message || inErr);
      }

      // Fallback: spawn the existing verifier script
      const scriptPath = path.join(process.cwd(), "scripts", "verify_response.js");
      const child = spawn("node", [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });

      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
      child.stderr.on("data", (chunk) => (stderr += chunk.toString()));

      child.on("error", (err) => {
        console.error("[verifier] spawn error", err);
      });

      child.stdin.write(text);
      child.stdin.end();

      child.on("close", (code) => {
        if (stderr) console.error("[verifier] stderr", stderr);
        try {
          const report = stdout ? JSON.parse(stdout) : {};
          return res.status(200).json({ ok: code === 0, code, report, source: 'child-process' });
        } catch (err) {
          console.error("[verifier] parse error", err, "stdout:", stdout, "stderr:", stderr);
          return res.status(500).json({ error: "verifier parse error", stdout, stderr });
        }
      });
    } catch (err) {
      handleError(res, err, "verify-response");
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
