# Google Cloud + Firebase Operations Guide

## Project Baseline (from current repo)
- Firebase project ID: `gen-lang-client-0312116426`
- Firestore database ID: `ai-studio-037afd9e-7975-495a-b35d-27afa336d0de`

## Required Environment Variables
Set these locally in `.env.local` and in deployment env settings.

```bash
GEMINI_API_KEY=
GCLOUD_PROJECT=gen-lang-client-0312116426
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
PINECONE_API_KEY=
TAVILY_API_KEY=
ADMIN_SECRET=
PORT=3000
```

## Console Checklist
1. Firebase Console
- Authentication providers enabled (Google + Email/Password).
- Firestore indexes and rules deployed.

2. Google Cloud Console
- Billing budget + alerts at 50/80/95/100%.
- API key restrictions set for Gemini key where possible.

3. Razorpay Dashboard
- Webhook configured to `/api/razorpay-webhook`.
- Webhook secret copied to `RAZORPAY_WEBHOOK_SECRET`.

## Deployment Notes
- Keep server-side keys only on backend runtime.
- Never expose Razorpay secret or admin secret in client bundles.
- Re-run `npm run build` after dependency updates.
