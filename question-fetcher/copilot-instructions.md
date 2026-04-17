# Copilot Operating Instructions (Google-First SaaS)

## Product and Architecture
- Prioritize premium UX with reliability over feature count.
- Keep architecture Google-first: Firebase Auth, Firestore, Firebase Storage, Gemini APIs.
- Keep payments on Razorpay unless explicitly requested otherwise.
- Prefer small, reversible changes with explicit validation after each change.

## Engineering Standards
- TypeScript strictness: avoid introducing `any` unless unavoidable.
- Backend endpoints must validate inputs and enforce auth where needed.
- Avoid hidden side effects; keep business logic in hooks/lib, not view components.
- Never commit secrets. Use `.env.local` and server-side env vars only.

## Delivery Workflow
1. Clarify acceptance criteria in 3-6 bullets.
2. Implement backend contract changes first, then frontend wiring.
3. Add/update UX states: loading, empty, error, success.
4. Run `npm run lint` and `npm run build` before finalizing.
5. Summarize what changed, risks, and next actionable steps.

## Cost and Operations
- Minimize API calls with caching and idempotent operations where possible.
- Prefer free-tier-compatible defaults in docs and implementation.
- Include operational notes for Firebase rules/indexes and webhook endpoints when relevant.

## Security Baseline
- Protect admin routes and maintenance endpoints.
- Verify payment signatures server-side.
- Sanitize and validate user inputs on all API routes.
- Do not expose server keys in client code.

## Context Persistence
- Treat `.github/instructions/context-persistence.instructions.md` as the hard policy layer for this project.
- Treat `.github/prompts/context-bootstrap.prompt.md` as the reusable new-chat bootstrap and memory template.
- Preserve the staging-first, quality-first defaults from those files unless the user explicitly changes scope.
