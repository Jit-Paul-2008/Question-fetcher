# v2 Backend Archive (Disabled in v1)

These route groups were removed from active `server.ts` for minimal v1 operation:

- `POST /api/publish`
- `GET /api/community-library`
- `POST /api/classroom/create`
- `POST /api/classroom/join`
- `GET /api/graph-data`
- `POST /api/admin/backfill`
- `POST /api/verify-response`

Also removed from active runtime:

- Pinecone vector query/upsert path
- Semantic cache lookup via embeddings
- Retry-with-backoff wrapper for AI calls

v1 keeps only low-cost essentials:

- `POST /api/scan`
- `GET /api/library`
- `GET /api/config`
- `GET /api/health`
- Payment routes (`/api/create-order`, `/api/verify-payment`, `/api/razorpay-webhook`)

If you want to restore any archived group in future, re-add route handlers in `server.ts` and wire the related frontend pages/hooks from `v2/frontend`.
