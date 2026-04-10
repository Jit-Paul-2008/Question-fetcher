# Project Status & Capabilities: ChemScan

**Date**: April 10, 2026
**Status**: Production-Ready / Fully Optimized (Tier 1) / RAG-Enabled

---

## 1. Current Abilities & Features

### 🔍 RAG-Enhanced Question Pipeline
- **Semantic Caching**: Utilizes **Pinecone** to store and retrieve millions of academic questions. If a topic has been scanned by any user, subsequent users receive results instantly via semantic lookup, bypassing AI/Search costs.
- **Dual-Mode Discovery**: 
  - **Mode A: Scan Notes**: Multimodal OCR for handwritten/printed materials.
  - **Mode B: Direct Topic Search**: Native support for up to 5 concurrent topics.
- **Schema Synchronization**: Standardized data structure (`text`, `answer`, `type`) across AI Extraction, React UI, and PDF/DOCX exports ensures zero data loss and 100% visibility.

### 📚 Global Knowledge Engine
- **Targeted Authority Search**: Exclusive focus on top-tier education sites (MathonGo, Allen, PW, Vedantu, etc.).
- **Strategic Window UI**: Premium carousel interaction with real-time "Strategic Window" insights.
- **Community Library**: Automatically archives all generated topics into a global pool for peer-to-peer discovery.

### 🛡️ Production Hardening
- **Visibility Guard**: Defensive fallbacks in UI rendering ensure that legacy data (stored under old schema keys) remains visible alongside new standardized data.
- **Enterprise Scale**: Deployed on Google Cloud Run with standard production environment secrets.
- **Cost Efficiency**: RAG implementation reduces operating costs from ~₹1.67 to **<₹0.10** for cached hits.

---

## 2. Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React / Vite (Tailwind + Framer Motion) |
| **Backend** | Node.js (TypeScript) / Express |
| **Database** | Firestore (Profile/History) + Pinecone (Vector RAG) |
| **Cloud** | Google Cloud Run (us-central1) |
| **AI Models** | Gemini 1.5 Flash-Lite + Gemini Text-Embedding-004 |
| **Search Engine** | Tavily Search SDK (Standard/Advanced) |

---

## 3. Financial Snapshot (Per Scan)

Costs are now divided between "Fresh Scans" and "RAG Cached Hits".

| Component | Fresh Scan Cost (INR) | RAG Cached Cost (INR) |
| :--- | :--- | :--- |
| **Tavily Search** | ~₹1.25 | ₹0.00 |
| **Gemini AI** | ~₹0.38 | ₹0.00 |
| **Pinecone/Embed** | ~₹0.02 | ~₹0.02 |
| **Infrastructure** | ~₹0.04 | ~₹0.04 |
| **TOTAL** | **~₹1.69** | **~₹0.06** |

> [!IMPORTANT]
> **RAG Profitability**: Cached hits yield a **~99% gross profit margin** on a ₹8 credit sale.

---

## 4. Production Environment
- **Service Domain**: [https://chemscan-49989755678.us-central1.run.app](https://chemscan-49989755678.us-central1.run.app)
- **Service Name**: `chemscan`
- **Region**: `us-central1`
- **Project**: `gen-lang-client-0312116426`
- **Port**: `8080` (Listen on `0.0.0.0`)
