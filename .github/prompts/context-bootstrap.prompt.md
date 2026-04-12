---
description: "Reusable project bootstrap for ChemScan context, policy, and update protocol"
---

# Section A: Critical findings
- Highest-risk gap: Gemini can return transient 503s and surface a 500 to the client even when search and cache succeed.
- Quality-risk gap: weak outputs must not be cached or replayed.
- Integrity-risk gap: PDF export must keep sanitization in place for all text fields.
- Operational-risk gap: staging and production must remain separate until staging is verified on the real flow.

# Section B: Essential context to preserve forever
- Goal: stabilize ChemScan / Question Fetcher on staging first, then promote to production only after manual verification.
- Stack: Node/Express backend, Vite/React frontend, Firestore named DB `ai-studio-037afd9e-7975-495a-b35d-27afa336d0de`, Firebase Auth, Cloud Run us-central1, Gemini 2.5 Flash, Tavily, Razorpay, optional Pinecone cache.
- Accepted decisions: use `gemini-2.5-flash`; keep staging auth domains allowlisted; keep question floor at 12 with auto top-up; keep cache quality gating; keep PDF sanitization; keep pricing aligned to `₹49/5`, `₹129/15`, `₹279/35`.
- Rejected ideas: mock fallback data, old pricing, old model names, and blind cache reuse of poor outputs.
- High-value suggestions: keep retry backoff, context capping, and cache invalidation over staleness when quality drifts.

# Section C: Forbidden actions and guardrails
```text
HARD POLICY BLOCK

- Never reintroduce stale model names, stale pricing, or stale auth/domain configuration.
- Never cache or replay outputs below the minimum quality threshold.
- Never remove PDF sanitization from generated text fields.
- Never treat transient upstream 503s as app bugs without checking logs first.
- Never widen scope before the local failure mode is confirmed.
- Never revert user-authored changes unless explicitly asked.
- Never deploy production changes until staging is verified on the real user flow.
- Never assume the wrong Firestore DB; always use the named DB.
- Never suggest non-Linux tooling when a Linux-safe option exists.
```

# Section D: Canonical project summary
- ChemScan is a staging-first AI question generation app.
- Current stable baseline: Cloud Run staging, Firebase Auth with staging allowlist, named Firestore DB, Gemini 2.5 Flash, Tavily search, aligned pricing, sanitized PDF export, and cache quality gates.
- The main remaining risk is upstream Gemini availability, not local app logic.

# Section E: New-chat bootstrap prompt
```text
You are working on ChemScan / Question Fetcher.

Defaults:
- Goal: preserve and improve the staging-verified scan pipeline, then promote to production only after manual validation.
- Stack: Node/Express backend, Vite/React frontend, Firestore named DB `ai-studio-037afd9e-7975-495a-b35d-27afa336d0de`, Firebase Auth, Cloud Run us-central1, Gemini 2.5 Flash, Tavily, Razorpay, optional Pinecone.
- Accepted decisions:
  - Use `gemini-2.5-flash`.
  - Keep staging domains allowlisted in Firebase Auth.
  - Keep question floor at 12 with auto top-up.
  - Keep cache quality gating; do not reuse weak outputs.
  - Keep PDF text sanitization enabled.
  - Keep pricing aligned to `₹49/5`, `₹129/15`, `₹279/35`.
- Known risk: Gemini may return transient 503s under load, which can surface as 500s.
- Guardrails:
  - Do not revert user changes.
  - Do not remove retry logic, validation, sanitization, or cache gates.
  - Do not assume the wrong Firestore DB.
  - Prefer minimal, local fixes and validate them immediately.
- Response style:
  - Be concrete, concise, and file-aware.
  - Start from the local failure mode or decision point.
  - If editing code, make the smallest correct change and validate it right away.
```

# Section F: Update protocol
- After every major change, record what changed, why it changed, what it replaced, what was validated, and what still needs user confirmation.
- Use this compact ledger format:
```text
DATE:
AREA:
CHANGE:
RATIONALE:
VALIDATION:
RISK:
FOLLOW-UP:
```
- If a change affects architecture, add it to permanent memory.
- If a change is temporary or session-specific, keep it in session memory.
- If a change removes a previous assumption, mark the old assumption as superseded.
- If a regression appears, record the failing symptom, the cheapest reproducer, and the fix status.
- For retrieval readiness, store one entry per distinct decision or failure mode.

# Optional vector-DB-ready schema
```json
{
  "id": "string",
  "type": "decision | bug | fix | constraint | validation | risk",
  "project": "chemscan",
  "timestamp": "ISO-8601",
  "summary": "short natural-language summary",
  "details": {
    "component": "server.ts | pdf.ts | search-taxonomy.ts | auth | deployment | cache",
    "cause": "root cause or rationale",
    "change": "what was changed",
    "validation": "what confirmed it",
    "rollback_risk": "low | medium | high"
  },
  "tags": ["staging", "firebase", "cloud-run", "gemini", "cache", "pdf", "pricing"]
}
```