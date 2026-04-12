---
description: "Hard policy for ChemScan context persistence"
applyTo: "**"
---

## Hard Policy
- Preserve the staging-first delivery model; promote to production only after staging is manually verified end to end.
- Keep the named Firestore DB `ai-studio-037afd9e-7975-495a-b35d-27afa336d0de` as the canonical data store unless the user explicitly changes it.
- Keep `gemini-2.5-flash` as the current model unless a newer validated replacement is confirmed.
- Do not remove question-floor enforcement, cache-quality gates, PDF sanitization, or auth allowlist fixes.
- Do not reintroduce old pricing, old model names, mock fallback data, or low-quality cache reuse.
- Treat transient Gemini 503s as upstream availability issues first; confirm with logs before changing product logic.
- Never revert user changes without explicit permission.
- Prefer minimal, local, Linux-safe changes with validation after each substantive edit.

## Response Discipline
- Start from the nearest failing file, endpoint, log line, or behavior.
- Make the smallest correct change.
- Validate with lint/build or a targeted runtime check before broadening scope.
- Report risks, residual uncertainty, and follow-up checks plainly.