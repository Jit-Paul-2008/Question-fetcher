---
title: "Policy: Staging-first promotion"
type: policy
date: 2026-04-12
tags: [chemscan, policy]
---

#chemscan

Summary: All changes must be validated end-to-end on staging before promotion to production.

Rationale:
- Protect production availability and user data.
- Staging allows controlled verification of model and auth changes.

Validation:
- Manual E2E run on staging with sample user account required.

Enforcement:
- CI gating and manual sign-off required before production deploy.
