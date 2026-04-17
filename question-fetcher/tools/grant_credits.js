#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

async function main() {
  const uid = process.argv[2] || process.env.GRANT_UID;
  const creditsToAdd = parseInt(process.argv[3] || process.env.GRANT_CREDITS || '10', 10);
  const testLink = process.argv[4] || process.env.TEST_LINK_VALUE || 'gcd';

  if (!uid) {
    console.error('Usage: node tools/grant_credits.js <uid-or-email> [credits=10] [testLink=gcd]');
    process.exit(1);
  }

  const svcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve('secrets/firebase-service-account.json');
  if (!fs.existsSync(svcPath)) {
    console.error('Service account not found at', svcPath);
    process.exit(1);
  }

  const svc = JSON.parse(fs.readFileSync(svcPath, 'utf8'));

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(svc),
      projectId: svc.project_id,
    });
  }

  const db = getFirestore('ai-studio-037afd9e-7975-495a-b35d-27afa336d0de');

  await db.runTransaction(async (t) => {
    const profileRef = db.doc(`users/${uid}/profile/data`);
    const userRef = db.doc(`users/${uid}`);
    const profileDoc = await t.get(profileRef);
    const current = profileDoc.exists ? (profileDoc.data()?.credits || 0) : 0;

    t.set(profileRef, {
      credits: current + creditsToAdd,
      testLink,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    t.set(userRef, {
      test_link: testLink,
      lastCreditUpdate: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  const updated = await db.doc(`users/${uid}/profile/data`).get();
  console.log('Updated profile data:', updated.data());
}

main().catch((err) => {
  console.error('Grant credits failed:', err);
  process.exit(2);
});
