# ChemScan Synthetic Laboratory – Master Protocol (v1.0)

This document serves as the absolute source of truth for the ChemScan project, governing code standards, AI orchestration, and production deployment.

## 1. Architectural Core
ChemScan is a hybrid RAG (Retrieval-Augmented Generation) platform for academic question synthesis.
- **Pipeline Flow**: Vision/Text Input -> Semantic Cache Search -> Multi-Step AI Synthesis -> Search Validation -> Structured Export.
- **Data Persistence**: 
    - **Firestore**: Global Cache, Discovery (Knowledge Map), and User History.
    - **Pinecone**: Semantic vector storage for question deduplication.

## 2. AI Model Strategy (Hardened)
The system is strictly optimized for the **Gemini 3.1 Flash-Lite** architecture.
- **Mandatory Model**: `gemini-3.1-flash-lite-preview` must be used for all synthesis tasks.
- **Vision Tasks**: Gemini 3.1 Flash-Lite handles OCR and visual mapping directly.
- **Strict Enforcement**: No fallbacks to `gemini-1.5-flash` or `gemini-pro` are permitted.
- **API Environment Variable**: The system strictly expects `GEMINI_API_KEY`. Do not use fallback names like `API_KEY` or `GOOGLE_API_KEY`.

## 3. Cost & Profitability Matrix
As of April 2026, the operational cost per report is optimized as follows:
- **AI Inference Cost**: ~$0.008 (Input/Output tokens).
- **Search Cost (Tavily)**: ~$0.024 (3-5 targeted searches).
- **Total COGS**: **~$0.032 per report (~₹2.60)**.
- **Business Model**: Credits sold at ₹9.80/unit (~70-75% Gross Margin).

## 4. Search Taxonomy & Domain Steering
The discovery engine uses a hierarchical domain steering matrix (covering 600+ permutations of Grade 6 to Graduation) to ensure high-authority academic results.

### 4.1 Tiered Academic Reach
- **Middle School (Grades 6–8)**: Focused on Magnet Brains, Khan Academy, and NextGurukul for conceptual foundations.
- **Secondary/Senior Secondary (9–12)**: Pivots between Board-specific nodes (CBSE, ICSE, ISC, WBSCHE).
- **Graduation/Research**: Targeted at NPTEL, MIT OCW, JSTOR, and specialized research aggregators.

### 4.2 Stream-Specific Clusters
- **Science Cluster**: JEE/NEET hubs (Allen, PW, MathonGo) + Academic nodes (Byjus, NCERT).
- **Commerce Cluster**: TSMG, CAAT, Shaalaa, and EduRev.
- **Humanities Cluster**: History.com, National Geographic, SuccessCDS, and Aglasem.
- **Language Cluster**: Targeted hubs for Sanskrit, English, Hindi, and Bengali (e.g., Bengaliformula).

### 4.3 Governance Hierarchy
1. **Board Priority**: Exam filters (e.g., `wbsche`) override general academic clusters.
2. **Contextual Scaling**: Competitive filters (e.g., `jee`) inject high-rigor prep nodes.
3. **Safety Fallback**: `DEFAULT` cluster ensures connectivity even if taxonomy mapping fails.

## 5. UI Design System: "No-Line" Terra
The platform follows a borderless aesthetic focused on tonal depth and layered shadows.
- **Tokens**:
    - Surfaces: `bg-muted/30` or `glass-white/20`.
    - Depth: Shadow-based (`shadow-2xl`, `shadow-inner`).
    - Borders: **DEPRECATE** all `border-` classes in favor of background contrast.
- **Key Classes**:
    - `.terra-card`: Shadow-based elevation, no border.
    - `.terra-glass`: Layered blur effect.

## 6. Onboarding & IDE Setup
To bring a new development environment online instantly:
1. **Env Requirements**: 
    - `GEMINI_API_KEY`: Strictly for Gemini 3.1 Flash-Lite.
    - `TAVILY_API_KEY`: For research-grade academic search.
    - `PINECONE_API_KEY`: For vector-memoization.
    - `FIREBASE_CONFIG`: (JSON) For data persistence and Knowledge Map.
2. **Build Order**: `npm install` -> `npm run dev`.
3. **Database Guard**: Ensure the `global_cache` and `discovery` collections in Firestore are initialized.

---
*Created by Antigravity AI – Production Finalization Phase.*
