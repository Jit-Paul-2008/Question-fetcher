# Team Workflow (You + Copilot)

This repository follows a multi-pass execution model for every non-trivial feature.

## Pass 1: Product Definition
- Define user story.
- Define explicit acceptance criteria.
- Define out-of-scope items.

## Pass 2: System Design
- Identify affected API routes.
- Identify Firestore collections/documents impacted.
- Identify UI states and component changes.

## Pass 3: Implementation
- Backend route/service updates.
- Frontend hook updates.
- Component wiring and UX polish.

## Pass 4: Validation
- `npm run lint`
- `npm run build`
- Manual smoke checks for changed flows.

## Pass 5: Operations and Cost
- Confirm env vars needed.
- Confirm auth and role checks.
- Confirm no unnecessary paid-service coupling.

## Required Response Pattern
- Findings first.
- Concrete file-level change summary.
- Risks and follow-up checks.

## Context Persistence
- Use `.github/instructions/context-persistence.instructions.md` as the always-on policy layer.
- Use `.github/prompts/context-bootstrap.prompt.md` to seed new chats with the canonical project context.
- When major decisions change, update the prompt and policy together so they stay synchronized.
