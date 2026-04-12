# Cost Tracking (Google-First + Razorpay)

Track usage weekly. Keep this file updated before major releases.

## Services to Track
- Gemini API
- Firestore (reads/writes/storage)
- Firebase Hosting/Storage (if used)
- Pinecone
- Tavily
- Razorpay fees

## Weekly Log Template
| Week | Feature/Change | Gemini Calls | Firestore Impact | External API Impact | Est. Monthly Cost Delta | Notes |
|---|---|---:|---|---|---:|---|
| YYYY-W## |  |  |  |  |  |  |

## Guardrails
- Set budget alerts at 50/80/95/100% in Google Cloud Billing.
- Cache repeat expensive generation requests when possible.
- Avoid fan-out queries in Firestore without index checks.
- Validate before enabling paid-tier upgrades.
