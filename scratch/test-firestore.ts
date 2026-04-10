
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: "gen-lang-client-0312116426",
  });
}

// Correct syntax for firebase-admin v11+
const db = getFirestore("ai-studio-037afd9e-7975-495a-b35d-27afa336d0de");

async function testFirestore() {
  try {
    console.log("Testing Firestore access to named database (new syntax)...");
    const collections = await db.listCollections();
    console.log("Found collections:", collections.map(c => c.id));
    console.log("Firestore access SUCCESS!");
  } catch (err) {
    console.error("Firestore access FAILED:", err.message);
  }
}

testFirestore();
