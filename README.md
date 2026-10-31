# OmniX-AI: AI-Powered Omnichannel Customer Journey & Experience Intelligence Platform

OmniX-AI is a production-grade, end-to-end customer journey orchestration, real-time intent personalization, and automated support intelligence suite designed to seamlessly adapt across web browsers and Android mobile viewports. Powered by Node.js, Express, PostgreSQL, React (Vite), Tailwind CSS, and the Google Gemini SDK (`@google/genai`).

---

## 🌟 Key Capabilities

1. **Omnichannel Ingestion & Mapping:** Unified ingestion pipeline across **Mobile App Support, Web Chat, Email Inbound, Social Mentions, and Voice Call Transcripts**.
2. **Synchronous Gemini Intelligence (`@google/genai`):**
   - Polarity scoring (`-1.00` to `+1.00`)
   - Intent & Root Cause Categorization (Mobile App Usability, Billing & Subscription, Account Authentication, Feature Request, Service Outage, Cancellation Threat)
   - Churn Risk Vulnerability Analysis (Low, Medium, High, Critical)
   - Urgency & Priority Triage (Low, Medium, High, Urgent)
3. **Smart Response & Personalization Studio:** Support agents can synthesize context-aware replies with strategic tone selection (**Empathetic, Executive, Consultative, De-escalation**) and internal technical notes.
4. **Android & Mobile Cross-Platform Adaptability:**
   - Touch-friendly drawer navigation and one-thumb bottom action bar (`MobileBottomNav`)
   - Dual-mode queue: desktop data table and swipeable touch card stack (`InteractionCardList`)
   - PWA Manifest readiness (`manifest.json`) and viewport optimization for mobile screens
5. **Dual-Mode Resilient Database Layer:**
   - Full PostgreSQL driver support with strict schema migrations (`migrations/001_init.sql`)
   - Zero-config auto-fallback local storage cache if PostgreSQL is not running locally, ensuring instantaneous out-of-the-box development and demo execution.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v20/v24)
- Optional: PostgreSQL database (or use built-in zero-config local engine)
- Optional: Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 2. Environment Variables Configuration (`.env`)
The `.env` file is located at the project root:

```env
# Server Network Configuration
PORT=5000
NODE_ENV=development
HOST=0.0.0.0

# Database Configuration (PostgreSQL URL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/omnix_db

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Gemini Model Selection
GEMINI_MODEL=gemini-2.5-flash
GEMINI_PRO_MODEL=gemini-2.5-pro

# Security & CORS Settings
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### 3. Installation
```bash
# Install root dependencies
npm install

# Install frontend client dependencies
cd client && npm install && cd ..
```

### 4. Running the Application

#### Option A: Full-Stack Development Mode (Concurrent Server & Vite Client)
```bash
npm run dev
```
- Frontend: `http://localhost:3000` (proxies `/api` to backend)
- Backend: `http://localhost:5000`

#### Option B: Production Mode (Single Port Unified Server)
```bash
# Build the React frontend
npm run build

# Start the unified Express server serving both APIs and the React bundle
npm start
```
Access the application at: **`http://localhost:5000`**

---

## 🧭 Application Pages & Routes

| Route | View | Description |
| :--- | :--- | :--- |
| `/` | **Executive CX Overview** | High-level metrics, CSAT trends, multi-channel distribution, and high-risk churn alerts |
| `/journey` | **Customer Journey Map** | Visual timeline of customer touchpoints across channels and sentiment trajectory |
| `/interactions` | **Interaction Queue** | Filterable, searchable queue with desktop table and mobile Android card stack |
| `/interactions/:id` | **Interaction Workspace** | Customer thread history, Gemini sentiment breakdown, churn gauge, and Response Studio |
| `/analytics` | **CX Analytics** | Bottleneck detection, department workloads, channel SLA compliance, and churn triggers |
| `/knowledge-base`| **Knowledge Base / RAG** | Contextual playbooks, Android billing guides, and SSO troubleshooting steps |
| `/settings` | **System & AI Settings** | Gemini API key configuration, live key verification, model selection, and DB status |

---

## 📡 Backend API Endpoints

- `GET /api/health` - Health check & DB connection inspector
- `GET /api/dashboard/metrics` - Aggregated executive CX metrics & Recharts data
- `GET /api/interactions` - Filterable, paginated list (`status`, `priority`, `channel`, `deviceType`, `sentiment`, `search`)
- `POST /api/interactions` - Ingest customer touchpoint & synchronously trigger Gemini AI analysis
- `GET /api/interactions/:id` - Retrieve interaction details, customer profile, and thread history
- `PATCH /api/interactions/:id` - Update status, priority, or assigned agent
- `POST /api/interactions/:id/analyze` - Force re-run Gemini AI sentiment and intent analysis
- `POST /api/interactions/:id/generate-response` - Generate smart reply draft with selected tone
- `POST /api/interactions/:id/responses` - Post agent message & optionally mark ticket Resolved
- `GET /api/customers` - List customer accounts with lifetime values and churn vulnerability
- `GET /api/customers/:id/journey` - Customer omnichannel timeline and journey progression
- `GET /api/knowledge-base` - Search playbook articles
- `POST /api/knowledge-base` - Add internal playbook article
- `GET /api/settings` - Current AI model tuning, triage rules, and database engine
- `POST /api/settings` - Update model parameters, temperature, and keys
- `POST /api/settings/test-gemini` - Verify Gemini API key in real-time

---

## 🛡️ Enterprise Security

- **Parameterized SQL Queries:** Strict parameterized queries (`$1, $2, ...`) for all database operations.
- **Zod Runtime Validation:** Client and server schemas for all payloads (`createInteractionSchema`, `generateResponseSchema`, etc.).
- **Helmet.js & CORS:** Configured HTTP security headers.
- **Express Rate Limiting:** Brute-force and DoS protection.
- **Server-Side API Key Protection:** `GEMINI_API_KEY` is never bundled into client-side code.

---

## 📄 License
MIT © OmniX-AI Enterprise

