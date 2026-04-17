# v2 Archive (Not Active in Current Runtime)

This folder stores deferred features for future versions.

Current runtime (v1 minimal mode) intentionally keeps only:
- Auth
- Scan (`/api/scan`) with class/subject/topic flow
- Payments (`/api/create-order`, `/api/verify-payment`, `/api/razorpay-webhook`)
- Personal history (`/api/library`)
- Firestore exact cache (`global_cache`)

Archived (disabled) feature areas:
- Community publishing and community library
- Classroom collaboration
- Knowledge map / graph visualization
- Admin backfill endpoint for vector indexing
- Vector database integration (Pinecone)

Archived frontend source lives under `v2/frontend`.
Archived backend notes (disabled routes/groups) live under `v2/backend`.
These files are kept for future work and are not wired into the current runtime flow.
