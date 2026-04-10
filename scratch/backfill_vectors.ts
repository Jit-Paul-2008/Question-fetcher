import "dotenv/config";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Clients ──────────────────────────────────────────────────────────────────
if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: "gen-lang-client-0312116426" });
}
const db = getFirestore();
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

async function runBackfill() {
  console.log("🚀 Starting Vector Backfill...");
  const snap = await db.collection("global_cache").get();
  console.log(`Found ${snap.size} question banks to process.`);

  for (const doc of snap.docs) {
    const data = doc.data();
    const topic = data.topicDetected || data.topic || "Unknown Topic";
    const subject = data.subject || "Chemistry";
    const id = doc.id;

    console.log(`Processing: [${subject}] ${topic} (ID: ${id})...`);

    const vector = await getTopicEmbedding(topic);
    if (!vector) continue;

    await pcIndex.upsert({
      records: [{
        id,
        values: vector,
        metadata: { topicDetected: topic, subject }
      }]
    });

    console.log(`✅ Vectorized ${topic}`);
  }

  console.log("✨ Backfill Complete!");
  process.exit(0);
}

runBackfill();
