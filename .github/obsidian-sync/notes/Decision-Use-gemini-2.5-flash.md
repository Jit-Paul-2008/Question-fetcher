---
title: "Decision: Use gemini-2.5-flash for staging"
type: decision
date: 2026-04-12
tags: [chemscan]
---

#chemscan

Summary: Use `gemini-2.5-flash` as the canonical model for staging until a validated replacement is approved.

Rationale:
- Model stability and compatibility verified in staging runs.
- Avoid hardcoding deprecated model names (`gemini-1.5-flash`).

Validation:
- Verified in staging on 2026-04-12; retry/backoff in place for transient 503s.

Follow-up:
- Reevaluate when newer validated models are available.
