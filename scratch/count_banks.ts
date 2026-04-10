import "dotenv/config";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: "gen-lang-client-0312116426" });
}
const db = getFirestore();

async function run() {
  const snap = await db.collection("global_cache").get();
  console.log("Total question banks in cache:", snap.size);
  process.exit(0);
}
run();
