# Superpowered Copilot Playbook (Google-First Beginner Runbook)

This runbook is now aligned to your current stack:
- Firebase Auth + Firestore
- Gemini / Google AI
- Razorpay payments
- Node + React app

Use this order strictly. Do not skip.

---

## Status

Phase 1 is completed by you.

Your codebase scan confirms Google-first architecture is already in place.

Continue from Phase 2 below.

---

## Phase 2 (Now): Google Console and Firebase Hardening

Goal: keep everything in Google ecosystem and production-safe.

## Step 2.1: Confirm Firebase project and services

Where to go:
- https://console.firebase.google.com

What to open:
1. Your Firebase project
2. Build -> Authentication
3. Build -> Firestore Database
4. Build -> Storage

What to verify:
1. Authentication enabled for Email/Password and Google provider.
2. Firestore database exists and is in Native mode.
3. Firestore rules are deployed from this repo.
4. Storage bucket exists (if you use file uploads).

## Step 2.2: Configure Google Cloud billing alerts (free-safe)

Where to go:
- https://console.cloud.google.com/billing

What to do:
1. Select your billing account.
2. Open Budgets & alerts.
3. Create budget with very low monthly cap.
4. Add alerts at 50%, 80%, 95%, and 100%.

If you have no billing account yet:
- keep free quotas only and skip paid resources for now.

## Step 2.3: Lock Gemini API usage to low risk

Where to go:
- https://aistudio.google.com

What to do:
1. Generate one API key for this project.
2. Restrict key usage to your app scope if possible.
3. Keep key only in local env, never in committed files.

## Step 2.4: Firebase monitoring in Google ecosystem

Where to go:
- Firebase Console -> Analytics
- Firebase Console -> Crashlytics
- Firebase Console -> Performance

What to do:
1. Enable Analytics.
2. Enable Crashlytics (if mobile/web path supports your setup).
3. Enable Performance Monitoring where possible.

Note:
- This replaces the earlier Sentry/PostHog recommendation for your Google-first preference.

---

## Phase 3: Project Files You Create (I Will Fill)

Create these exact files and paths:

1. [copilot-instructions.md](copilot-instructions.md)
2. [.github/pull_request_template.md](.github/pull_request_template.md)
3. [.github/ISSUE_TEMPLATE/feature_request.md](.github/ISSUE_TEMPLATE/feature_request.md)
4. [.github/ISSUE_TEMPLATE/bug_report.md](.github/ISSUE_TEMPLATE/bug_report.md)
5. [docs/COST_TRACKING.md](docs/COST_TRACKING.md)
6. [docs/ARCHITECTURE_DECISIONS.md](docs/ARCHITECTURE_DECISIONS.md)
7. [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md)
8. [docs/GOOGLE_CLOUD_OPERATIONS.md](docs/GOOGLE_CLOUD_OPERATIONS.md)

Run in terminal:

```bash
mkdir -p .github/ISSUE_TEMPLATE docs
touch copilot-instructions.md
touch .github/pull_request_template.md
touch .github/ISSUE_TEMPLATE/feature_request.md
touch .github/ISSUE_TEMPLATE/bug_report.md
touch docs/COST_TRACKING.md
touch docs/ARCHITECTURE_DECISIONS.md
touch docs/RELEASE_CHECKLIST.md
touch docs/GOOGLE_CLOUD_OPERATIONS.md
```

Do not fill content yourself.
I will fill all of these after handoff.

---

## Phase 4: Secret Management (Google + Razorpay)

## Step 4.1: Ensure local env exists

Run:

```bash
touch .env.local
```

## Step 4.2: Put only placeholders now

Put these keys in [.env.local](.env.local):

```bash
GEMINI_API_KEY=
GCLOUD_PROJECT=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
PINECONE_API_KEY=
TAVILY_API_KEY=
ADMIN_SECRET=
```

## Step 4.3: Verify ignore rule

Run:

```bash
git check-ignore -v .env.local
```

Expected:
- command returns a rule showing `.env.local` is ignored.

If not ignored, stop and message me immediately.

---

## Phase 5: Low-Cost Operations Setup

Do these now:

1. In Firebase/Google Cloud, set budget alerts (50/80/95/100).
2. In Razorpay dashboard, enable webhook logging and payment alerts.
3. Keep hosting on free plan first (Vercel/Netlify/Render).
4. Do not enable paid database/storage tiers yet.

---

## Phase 6: Handoff to Me (Then I Take Over)

When done, send this exact message in chat:

I COMPLETED PHASE 2 TO PHASE 5 ON GOOGLE-FIRST STACK. TAKE OVER IMPLEMENTATION NOW.

Then I will:
1. Fill all newly created files with production-grade content.
2. Wire Google-first operational docs and checklists.
3. Add strict cost tracking workflow to repo.
4. Set step-by-step feature delivery workflow (idea -> ship).
5. Finish premium SaaS operating system inside this codebase.

---

## Quick Checklist (Google-First)

- [x] Phase 1 completed
- [ ] Firebase auth/firestore/storage verified in console
- [ ] Google billing budget alerts configured
- [ ] Gemini key generated and secured
- [ ] Monitoring enabled in Firebase console
- [ ] Required files created at exact paths
- [ ] `.env.local` contains placeholders only
- [ ] `.env.local` ignore verified
- [ ] Handoff message sent

When checked, stop and hand over to me.
