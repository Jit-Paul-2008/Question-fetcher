# ChemScan Improvement Tracker

This document tracks the evolution of ChemScan from a utility tool to a full-scale AI platform.

## Phase A: Foundations & Payment Pipeline [COMPLETED]
*Goal: Secure the app for production and revenue.*

- [x] **Razorpay Integration**: Implemented live keys and secure checkout.
- [x] **Webhook Security**: Added HMAC signature verification to prevent spoofing.
- [x] **Deduplication Logic**: Transactional credit updates to prevent double-crediting.
- [x] **Refund Handling**: Revoke credits automatically if a payment is refunded.
- [x] **UI Prioritization**: QR/UPI prioritized in checkout for higher conversion.

## Phase B: Core AI & Dual-Mode Pipeline [COMPLETED]
*Goal: Flexibility and high-quality question extraction.*

- [x] **Vision Mode**: Extract questions from notes/handwriting (Gemini Vision).
- [x] **Topic Mode**: Generate questions directly from text input (up to 5 topics).
- [x] **Intelligent Synthesis**: Gemini analyzes notes + Tavily searches real PYQs.
- [x] **Subject Specialization**: Standardized labels for JEE, NEET, and Boards.

## Phase C: Scaling & Community [IN PROGRESS]
*Goal: Cost reduction and platform networking.*

- [x] **Global RAG Caching**: Instant matching for popular topics (Exact matching via Firestore).
- [x] **Community Library**: Users can publish and share question banks.
- [x] **Classroom Feature**: 6-digit codes for teachers to share banks with students for free.
- [x] **Celebration UI**: Interactive feedback for classroom joins.
- [ ] **Vector Database Migration**: Upgrade from exact matching to semantic search (Next Step).
- [ ] **User Feedback Loop**: Upvote/Downvote questions to improve cache quality.

## Future Roadmap (Next Ideas)
1. **Analytics Dashboard**: Teachers see which questions students struggle with most.
2. **Personalized Recommendations**: If a student fails a topic, recommend specific banks from the Library.
3. **AI Proctoring**: Basic quiz mode with timing and score tracking.
4. **Subscription Model**: Monthly unlimited scans for institutions.
