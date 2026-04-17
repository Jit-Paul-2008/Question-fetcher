<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/037afd9e-7975-495a-b35d-27afa336d0de

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Run In Production / Staging

1. Build the frontend assets:
   `npm run build`
2. Ensure environment variables are set (see `.env.example`), including `PUBLIC_APP_URL`.
3. Start the server in production mode:
   `npm start`

## Current Scope (Minimal v1)

The active app now focuses on low-cost, high-quality retrieval:

- User authentication + credits/payments
- Scan by notes upload or topic query
- Gemini query generation + Tavily retrieval + question synthesis
- Personal history archive (topic, timestamp, question count)
- Export to PDF/DOCX

Deferred features are archived in `v2/` and are intentionally not wired into the running app.

- Community publishing/library
- Classroom collaboration
- Knowledge map / graph views
- Vector database integration (Pinecone)

The cache path in v1 is Firestore exact-match only (`global_cache`) to keep operational cost low.

## Staging

Staging (Cloud Run) example:

Staging URL: https://chemscan-49989755678.us-central1.run.app/

Set `PUBLIC_APP_URL` in your service environment to this value when deploying.
