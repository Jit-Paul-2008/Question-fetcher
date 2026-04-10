# Project Status & Capabilities: ChemScan

**Date**: April 10, 2026
**Status**: Production-Ready / Fully Functional

---

## 1. Current Abilities & Features

### 🔍 Intelligent Question Scanning
- **Multimodal Support**: Analyzes images and PDFs (via OCR/Vision) to detect core topics and keywords.
- **Dynamic Search Query Generation**: Automatically generates and executes targeted web searches via **Tavily** to ground question data in real-world facts.
- **Expert Question Synthesis**: Mimics high-level human expert reasoning to structure questions with options, correct answers, and subject classifications.
- **Targeted Authority Searching**: (New) Search is restricted to high-quality educational domains (e.g., MathonGo, Allen, Vedantu, BYJU'S) to ensure factual accuracy and high question density.

### 🛡️ Resilient Architecture
- **Exponential Backoff**: Automatically handles temporary API spikes (503 errors) with smart retries on the cost-optimal model.
- **User Alerts**: Clearly informs users when Google's servers are busy and suggests manual retries.

### 💳 Commercial & User Management
- **Firestore Integration**: Manages user profiles and real-time credit balances (linked to AI Studio named database).
- **Secure Payments**: Integrated with **Razorpay** for top-tabbing balance/credits.
- **Local Dev Readiness**: Configured for Application Default Credentials (ADC) for seamless local maintenance.

---

## 2. Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React / Vite |
| **Backend** | Express / Node.js (TypeScript) |
| **Database** | Google Cloud Firestore |
| **Cloud** | Google Cloud Run (US-Central1) |
| **AI Models** | Gemini 2.5 Flash & Pro |
| **Search Engine** | Tavily Search SDK |

---

## 3. Cost Analysis (Rough Estimate)

Estimates are based on average April 2026 pricing and typical token usage for one "Complete Scanning Query."

### Per-Query Breakdown

| Component | Usage (Avg) | Cost (Flash Only) |
| :--- | :--- | :--- |
| **Tavily Search** | 3 Queries (Filtered) | $0.015 |
| **Step 1: Vision** | 2.5k Tokens | $0.002 |
| **Step 3: Structuring** | 22k Tokens | $0.018 |
| **TOTAL** | — | **~$0.035 / query** |

> [!NOTE]
> **Production Context**: 
> - 1,000 queries cost approximately **$35.00**.
> - Yield has increased from **15 to ~30 questions** per query thanks to Targeted Authority Searching, effectively doubling the value per token.

---

## 4. Current Configuration

Ensure these remain configured in the production environment:
- `GEMINI_API_KEY`: Active (Tier 1/2)
- `TAVILY_API_KEY`: Active (Pay-as-you-go)
- `RAZORPAY_KEY_ID`: Configured
- `firestoreDatabaseId`: `ai-studio-037afd9e-7975-495a-b35d-27afa336d0de`
