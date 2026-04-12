---
title: "Scan Question Yield Optimization Plan"
type: update
---

# Scan Question Yield Optimization Plan

Date: 2026-04-12
Status: Hybrid strategy draft (your optimization plan + existing guardrails)

## Goal
Increase extracted question count while keeping cost low, preserving UX quality, and preventing duplicates.

## Optimization Principle (Hybrid)
- Combine your optimization plan with current protective system behavior.
- Keep retrieval adaptive rather than rigid.
- Roll out only through staging with metric gates before production promotion.

## Non-Negotiables
- Do not worsen UX.
- Do not reduce overall search quality or effective recall.
- Keep question floor enforcement (`>= 12`) intact.
- Keep taxonomy-driven domain guidance as the primary recall booster.
- Keep adaptive fallback cascade: domain-first retrieval -> domain-scoped supplemental retrieval -> open-web rescue only when still below floor -> final retryable failure with refund if floor is still missed.
- Keep strict dedupe before final response.
- Keep source labels clean (no site URLs in `source`).

## High-Level Strategy
1. Domain-first retrieval with stronger taxonomy tuning
- Continue using per-combination domain mapping from `src/lib/search-taxonomy.ts`.
- Improve the domain sets for each class/exam/subject combination so Tavily queries hit question-rich sources first.
- Keep fallback behavior only for rare misses; do not narrow quality globally.

2. Maximize yield per Tavily call
- Increase `TAVILY_MAX_RESULTS` to raise question-bearing snippets per request.
- Use deeper `TAVILY_SEARCH_DEPTH` for domain-scoped queries where cost-quality tradeoff remains acceptable.
- Keep query phrasing exam-aware and topic-aware to raise precision without reducing recall.

3. Cache aggressively and safely
- Reuse strong results from `global_cache` via taxonomy-aware cache keys.
- Keep freshness window so repeated scans avoid re-spending Tavily/Gemini budget.
- Keep quality gate (`CACHE_MIN_QUESTIONS`) so weak caches are not replayed.

## Guardrails Retained from Current System
1. Adaptive fallback
- Run domain-scoped primary retrieval first.
- If source coverage is weak, run domain-scoped supplemental retrieval.
- If still below floor, run open-web rescue as a rare final enrichment step.
- If floor is still missed after rescue, return retryable failure and refund credit.

2. Strict dedupe
- Keep normalization-based dedupe on all merged question sets.
- Never return duplicate question text variants.

3. Additive floor recovery
- Never reset the scan output from scratch.
- Add only the missing questions required to reach floor.

4. Source sanitation
- Keep URL stripping and normalized source label categories.

## Rare Floor-Miss Behavior (Important)
When results are below floor (< 12), do not restart from scratch.

Required behavior:
- Add only missing questions to the existing set.
- Avoid repeating prior query patterns.
- Ask Gemini for a better query rewrite (not repetitive rewrites).
- De-prioritize already-underperforming domains first (not permanent exclusion).
- Preserve non-domain-restricted rescue only as a rare final pass.

Implementation intent:
- Track `usedQueries`, `usedDomains`, and per-domain yield for the scan.
- Build rescue query prompt with explicit constraints:
  - "Do not repeat prior query templates"
  - "Prioritize unseen domains"
  - "Target missing question styles"
- If unseen-domain rescue remains below floor, allow controlled re-entry into best-yield prior domains before open-web rescue.
- Merge new questions into existing list with strict dedupe.

## Source Field Policy
`source` must be descriptive only, no URLs.

Allowed examples:
- `PYQ 2022 JEE Main`
- `Sample Paper CBSE Class 12`
- `HOTS Stoichiometry Set`
- `Practice Mixed Concept`

Disallowed:
- Any website/domain links or raw URLs.

## Cost Knobs (Planned)
Tune these without harming UX:
- `TAVILY_MAX_RESULTS`: raise to `20` (from current default `15`) to improve per-call yield.
- `MAX_TAVILY_QUERIES`: increase moderately to `5` or `6` if budget permits.
- `MAX_TOPUP_ATTEMPTS`: keep low (`0` to `2`) based on quality/cost target.
- `GEMINI_COST_BUFFER_INR`: tune to realistic per-scan LLM budget target.

## Suggested Starting Configuration (Staging)
- `TAVILY_MAX_RESULTS=20`
- `MAX_TAVILY_QUERIES=5`
- `MAX_TOPUP_ATTEMPTS=1`
- `GEMINI_COST_BUFFER_INR=0.8` (adjust after telemetry)

## Implementation Checklist (Tomorrow)
1. Update defaults/env docs in:
- `src/server/config/scanConfig.ts`
- `.env.example`

2. Improve rescue query generation in:
- `server.ts`

Required changes:
- Add tracking for prior queries/domains used in this scan.
- Add non-repetitive query rewrite prompt for Gemini.
- Replace hard domain exclusion with domain de-prioritization plus adaptive re-entry.
- Ensure rescue adds only missing count; never discard existing valid questions.
- Preserve existing floor protection and refund behavior if final floor miss remains.

3. Keep dedupe and floor logic:
- Preserve current normalization + dedupe set.
- Keep floor check and additive top-up behavior.

4. Keep source normalization strict:
- Continue URL stripping from `source`.
- Normalize source categories to `PYQ`, `Sample Paper`, `HOTS`, `Practice` plus optional year/exam detail.

5. Add metric-gated staging rollout:
- Capture baseline metrics on current behavior.
- Run hybrid strategy on same topic mix.
- Promote only if quality and UX thresholds pass.

## Validation Plan
Track these in staging for baseline vs hybrid on 20-50 scans per cohort:
- `geminiCalls`
- `tavilyRequests`
- `tavilyCredits`
- final question count
- duplicate rejection count
- floor miss/refund rate

Success criteria:
- Average and p50 question count increase or remain stable at high quality.
- Duplicate return rate remains effectively zero.
- Floor miss/refund rate is no worse than baseline (target equal or lower).
- Gemini calls per scan decreases without quality regression.
- Tavily credits per successful scan stay inside target budget envelope.

## Rollout Rule
Staging-first only. Promote to production only after manual end-to-end validation confirms quality and cost targets.

#chemscan
