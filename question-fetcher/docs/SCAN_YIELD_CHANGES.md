Scan Yield Optimization - Code Changes

Date: 2026-04-13

Files changed:
- src/server/config/scanConfig.ts
- .env.example
- server.ts

Summary of changes:
- Increased default `TAVILY_MAX_RESULTS` to 20 and `MAX_TAVILY_QUERIES` to 5; reduced `MAX_TOPUP_ATTEMPTS` to 1 (staging defaults).
- Added runtime tracking: `usedQueries`, `usedDomains`, and `domainYield` to the scan pipeline.
- Enhanced `runSearchBatch` to record per-query and per-domain yields and support prioritized domain lists.
- Implemented a Gemini-powered rescue query rewrite that attempts non-repetitive, unseen-domain-first queries before open-web rescue.
- Supplemental retrieval now prioritizes unseen/low-yield domains.
- Preserved existing dedupe, additive top-up, floor enforcement, and cache gating behavior.

Next steps (staging):
1. Run 20-50 scans on the same topic mix and capture metrics (geminiCalls, tavilyRequests, tavilyCredits, final question count, duplicate rejections, floor misses/refunds).
2. Tune `GEMINI_COST_BUFFER_INR`, `MAX_TAVILY_QUERIES`, and `TAVILY_MAX_RESULTS` if needed based on telemetry.
3. Review sample scans to ensure source `source` fields remain URL-free and descriptive.

Notes:
- No production promotion performed. Changes are intended for staging-first rollout and validation.
