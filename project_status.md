# Project Status & Capabilities: ChemScan

**Date**: April 10, 2026
**Status**: Production-Ready / Fully Optimized (Tier 1)

---

## 1. Current Abilities & Features

### 🔍 Dual-Mode Question Pipeline
- **Mode A: Scan Notes**: Leverages Multimodal Vision (OCR) to analyze handwritten/printed notes (Images/PDF/DOCX) and extract core academic topics.
- **Mode B: Direct Topic Search**: Allows users to enter up to **5 specific topics** directly. Skips image analysis for 5% faster processing and lower token cost.
- **High-Yield Extraction**: Configured to deliver **25-30 unique questions** per report by utilizing expanded search snippets (1,500 chars) and advanced domain filtering.

### 📚 Authoritative Source Analysis
- **Targeted Search**: Queries are locked to high-authority educational domains (MathonGo, Allen, Vedantu, BYJU'S, etc.).
- **Detailed Attribution**: Every question includes a detailed text source (e.g., *'PYQ 2023 JEE Mains'*) without external links, ensuring a clean and distraction-free experience.
- **Deduplication**: Multi-stage filtering prevents repeated questions within the same report.

### 🛡️ Production Hardening
- **Tier 1 Performance**: Migration to Paid Tier 1 has resolved "Limit Hit" issues.
- **Flash-Lite Optimization**: Exclusively uses **Gemini 3.1 Flash-Lite** for all AI logic, balancing lightning speed with deep academic reasoning.
- **Resilient Retry logic**: Built-in exponential backoff handles temporary busy states on Google's side.

---

## 2. Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React / Vite (Vanilla CSS) |
| **Backend** | Node.js (TypeScript) / Express |
| **Database** | Google Cloud Firestore |
| **Cloud** | Google Cloud Run (us-central1) |
| **AI Models** | Gemini 3.1 Flash-Lite |
| **Search Engine** | Tavily Search SDK |

---

## 3. Financial Snapshot (Per Scan)

Current costs are optimized for maximum profitability on Tier 1 Postpay.

| Component | Usage | Cost (INR) |
| :--- | :--- | :--- |
| **Tavily Search** | 3 Advanced Queries | ~₹1.25 |
| **Gemini AI** | ~35k Tokens (Input/Output) | ~₹0.38 |
| **Infrastructure** | Firebase / Cloud Run | ~₹0.04 |
| **TOTAL OPERATING COST**| Per Report | **~₹1.67** |

> [!TIP]
> **Profit Margin**: With a standard sale price of **₹8 - ₹10 per credit**, the project maintains a **~80% gross profit margin**.

---

## 4. Production Environment
- **Service Name**: `chemscan`
- **Region**: `us-central1`
- **Project**: `gen-lang-client-0312116426`
- **Port**: `8080` (Listen on `0.0.0.0`)
