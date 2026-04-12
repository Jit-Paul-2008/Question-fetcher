import "dotenv/config";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenAI } from "@google/genai";

async function runAudit() {
  console.log("🚀 Starting ChemScan Production Audit...\n");

  // 1. Firebase Connectivity
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId: process.env.GCLOUD_PROJECT || "gen-lang-client-0312116426",
      });
    }
    const db = getFirestore("ai-studio-037afd9e-7975-495a-b35d-27afa336d0de");
    const snapshot = await db.collection("global_cache").limit(1).get();
    console.log("✅ Firestore: Connected. Cache found:", !snapshot.empty);
  } catch (err: any) {
    console.error("❌ Firestore: Failed.", err.message);
  }

  // 2. Pinecone Connectivity
  try {
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || "" });
    const index = pc.index("chemscan");
    const stats = await index.describeIndexStats();
    console.log("✅ Pinecone: Connected. Index 'chemscan' stats:", JSON.stringify(stats));
    if (stats.dimension !== 768) {
      console.warn(`⚠️ Pinecone Warning: Dimension mismatch! Expected 768, found ${stats.dimension}`);
    } else {
      console.log("✅ Pinecone: Dimension verified (768).");
    }
  } catch (err: any) {
    console.error("❌ Pinecone: Failed.", err.message);
  }

  // 3. Gemini Connectivity
  try {
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    const result = await genAI.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [{ parts: [{ text: "Hello, strictly respond with 'OK'." }] }]
    });
    console.log("✅ Gemini API: Connected. Response:", result.text?.trim() || "Empty response");

    const embedResult = await genAI.models.embedContent({
      model: "gemini-embedding-001",
      contents: [{ parts: [{ text: "test" }] }],
      config: { outputDimensionality: 768 }
    });
    console.log("✅ Gemini Embedding: Connected. Vector size:", embedResult.embeddings?.[0]?.values?.length);
    if (embedResult.embeddings?.[0]?.values?.length !== 768) {
      console.warn("⚠️ Vector size mismatch! Expected 768.");
    }
  } catch (err: any) {
    console.error("❌ Gemini: Failed.", err.message);
  }

  console.log("\nAudit Complete.");
  process.exit(0);
}

runAudit();
