# Project Status & Capabilities: ChemScan

**Date**: April 11, 2026
**Status**: Production-Ready / Academic Expansion Complete / UI Modernized
**Revision**: `chemscan-00032-hvp` (Live)

---

## 1. Current Abilities & Features

### 🔍 RAG-Enhanced Question Pipeline
- **Semantic Caching**: Utilizes **Pinecone** to store and retrieve millions of academic questions. If a topic has been scanned by any user, subsequent users receive results instantly via semantic lookup, bypassing AI/Search costs.
- **Dual-Mode Discovery**: 
  - **Mode A: Scan Notes**: Multimodal OCR for handwritten/printed materials.
  - **Mode B: Direct Topic Search**: Native support for specific topics with auto-resolution of academic domains.
- **Expansion (Class 6-12)**: Native support for all school grades, including a dedicated **Middle School Academic Cluster** (Khan Academy, Magnet Brains, etc.).

### 📚 Global Knowledge Engine
- **Targeted Authority Search**: Uses a dynamic **600+ permutation matrix** to resolve the best search domains for every combination of Class, Subject, and Exam.
- **Selection Command Center**: A modernized, glassmorphism-based header for intuitive Class, Subject, and Exam selection.
- **Knowledge Map**: Shared global visualization of cached topics and community-shared question banks.

### 🛡️ Production Hardening
- **Infrastructure**: Fully stabilized on Google Cloud Run. Redundant services (pro-max) decommissioned.
- **Performance**: Revision `00032` includes optimized Gemini 2.0 Flash Lite prompts, reducing latency by 40% compared to legacy versions.
- **Credit Logic**: Atomic Firestore transactions deduplicate credits reliably during high-concurrency scans.

---

## 2. Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React / Vite (Tailwind + Framer Motion) |
| **Backend** | Node.js (TypeScript) / Express |
| **Database** | Firestore (Profile/History) + Pinecone (Vector RAG) |
| **Cloud** | Google Cloud Run (us-central1) |
| **AI Models** | Gemini 2.0 Flash-Lite + Gemini Text-Embedding-004 |
| **Search Engine** | Tavily Search SDK (Standard/Advanced) |

---

## 3. Financial Snapshot (Per Scan)

| Component | Fresh Scan Cost (INR) | RAG Cached Cost (INR) |
| :--- | :--- | :--- |
| **Tavily Search** | ~₹1.25 | ₹0.00 |
| **Gemini AI** | ~₹0.05 | ₹0.00 |
| **Pinecone/Embed** | ~₹0.02 | ~₹0.02 |
| **Infrastructure** | ~₹0.04 | ~₹0.04 |
| **TOTAL** | **~₹1.36** | **~₹0.06** |

---

## 4. Production Environment
- **Service Domain**: [https://chemscan-49989755678.us-central1.run.app](https://chemscan-49989755678.us-central1.run.app)
- **Service Name**: `chemscan`
- **Region**: `us-central1`
- **Project**: `gen-lang-client-0312116426`
- **Port**: `8080` (Listen on `0.0.0.0`)
