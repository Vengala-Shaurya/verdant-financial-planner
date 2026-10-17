# VERDANT — TECHNICAL PROJECT DOCUMENTATION
**Project Title:** AI-Based Personalised Savings and Financial Planning System  
**Product Name:** VERDANT — Personal Finance, Intentionally Planned  
**Academic Context:** Professional Training I (PT1) Project Review  
**Date:** October 2026  

---

## 1. Executive Summary & Objective

VERDANT is a functional, presentation-ready full-stack web application developed for the Professional Training I project. Its objective is to analyze an individual's verified income, essential outflows, discretionary spending velocity, and multi-horizon financial goals to generate an optimized, personalized savings plan.

### Core Architectural Philosophy: "Zero Financial Hallucination"
A key challenge with AI in financial planning is hallucinations (e.g., allocating more money than available surplus, or double-counting debt obligations). VERDANT resolves this by maintaining a strict **separation of concerns**:
- **Deterministic Calculation Engine (Python):** Governs all mathematical budgets, surplus constraints, priority weights, and month-by-month compounding simulations.
- **Contextual LLM Synthesis (OpenAI GPT-4o-mini / Fallback):** Synthesizes qualitative insights, contextual behavioral rationales, and risk mitigation strategies without altering verified numerical allocations.
- **Strict Data Isolation & Authentication:** Every personal account has its own isolated records in SQLite. Fictional demo records for Arjun Verma remain completely separate and are never seeded or leaked into newly registered accounts.

---

## 2. Authentication & Data Isolation Architecture

### A. Dual-Mode Entry: Demo vs. Personal
1. **Academic Demo Account — Arjun Verma:**
   - Dedicated 1-click entry via `/api/auth/demo-login`.
   - Seeded with calibrated PT1 presentation baseline:
     - Monthly Income: **₹50,000**
     - Fixed Expenses: **₹15,000**
     - Variable Expenses: **₹10,000**
     - Separate Debt Obligations: **₹3,000**
     - Existing Liquid Savings: **₹40,000**
     - Monthly Net Surplus: **₹22,000** (44% potential savings rate)
     - Emergency Runway: **1.6 Months**
   - Labeled clearly with an "Academic Demo Profile" indicator.
   - Demo resets are restricted exclusively to Arjun's account.

2. **Personal Verified Accounts:**
   - Case-insensitive email uniqueness constraint (`LOWER(email)`).
   - Secure PBKDF2 password hashing via `werkzeug.security`.
   - Signed JWT Bearer tokens with 72-hour expiration, passed in `Authorization: Bearer <token>` headers or secure `verdant_token` cookies.
   - Clean slate registration: Newly registered accounts start with 0 expenses and 0 goals, never inheriting demo records.

### B. First-Time Personal Onboarding Flow
Upon registration, if `is_onboarded == 0`, users are directed to a guided 4-step onboarding wizard:
- **Step 1 (Basic Profile):** Display name and currency preference (INR default).
- **Step 2 (Monthly Financial Baseline):** Take-home income, fixed expenses, variable expenses, liquid savings, and debt obligations (including whether debt is already part of fixed commitments).
- **Step 3 (Initial Financial Goal):** Milestone name, category, target amount, existing saved balance, target date, and priority.
- **Step 4 (Review & Synthesis):** Verifies the computed surplus and triggers deterministic plan generation and persistence before transitioning to the personal dashboard.

### C. Server-Side Scoped Endpoints
All private endpoints enforce `@require_auth` and derive user identity exclusively from `g.current_user['id']`:
- `/api/expenses/` (Scoped read, create, update, delete)
- `/api/goals/` (Scoped read, create, update, delete, contribute)
- `/api/plans/generate`, `/api/plans/save`, `/api/plans/active` (Scoped financial engine execution)
- `/api/dashboard/overview`, `/api/dashboard/notifications` (Scoped metrics & alerts)
- `/api/ai/plan-insights`, `/api/ai/spending-insights`, `/api/ai/ask`, `/api/ai/history` (Scoped prompt synthesis)

Cross-account tampering attempts return `404 Not Found / Access Denied`.

---

## 3. Technology Stack & Tools Used

| Layer / Component | Technology Used | Rationale & Architectural Purpose |
|---|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite | Component-driven reactive architecture with sub-second HMR and full type safety. |
| **Styling & Aesthetics** | Tailwind CSS + Custom CSS Variables | "The Living Ledger" editorial aesthetic inspired by premium wealth journals (Warm Paper `#F6F3EB`, Forest Green `#183D32`, Ink `#202822`, Chartreuse `#D5EE75`, Terracotta `#C66D51`). |
| **Typography** | Google Fonts (*Instrument Serif*, *Plus Jakarta Sans*, *JetBrains Mono*) | High typographic hierarchy with tabular monospaced numbers for financial figures. |
| **Authentication** | PyJWT, Werkzeug PBKDF2 Hashing | Signed JWT session tokens with password hashing; server-side `@require_auth` decorator. |
| **Data Visualisation** | Recharts (ResponsiveContainer, BarChart, AreaChart, Pie) | SVG charts for cash-flow waterfalls, category spend distributions, and 12-month wealth simulation curves. |
| **Backend Server** | Python 3.12, Flask, Flask-CORS | Modular REST API service handling calculation services, validation, and data serialization. |
| **Database & Persistence**| SQLite (`verdant.db`) | Embedded relational database with foreign-key indexes on `user_id`. |
| **AI Integration** | Hybrid OpenAI API + Deterministic Fallback | LLM API with an automatic, calibrated deterministic editorial wealth engine when no API key is present. |
| **Testing** | Python `unittest` (13 automated tests) | Covers authentication, duplicate rejection, data isolation, onboarding, financial math, and AI fallbacks. |

---

## 4. The Three AI Features (Authenticated & Scoped)

1. **AI Feature A: Personalised Savings-Plan Explanations (`/api/ai/plan-insights`)**
   - Retrieves the user's active deterministic plan and provides qualitative breakdowns of goal feasibility, 30-day behavioral steps, and discretionary reductions.
2. **AI Feature B: Personalised Spending Insights (`/api/ai/spending-insights`)**
   - Audits the user's actual ledger transactions to detect velocity trends, category concentration, and large outflows (threshold ≥ ₹5,000).
3. **AI Feature C: Ask VERDANT Conversational What-If Simulation (`/api/ai/ask`, `/api/ai/history`)**
   - Chat assistant capable of parsing natural language hypothetical scenarios (e.g., *"What if my income increases by 10,000?"*), simulating the recalculation in Python without altering persistent database records.

---

## 5. Verification & Test Execution Results

All 13 automated backend tests and the TypeScript production build pass:

```bash
# 1. Automated Test Suite (13 tests)
PYTHONPATH=.:backend ./venv/bin/python -m unittest discover -s backend/tests
----------------------------------------------------------------------
Ran 13 tests in 0.546s
OK

# 2. Frontend Production Bundle
npm run build
✓ 2506 modules transformed.
dist/index.html                   1.13 kB
dist/assets/index-Cx24ZEpH.css   33.02 kB
dist/assets/index-BzQnFmOh.js   750.67 kB
✓ built in 432ms
```

### Verified Scenarios:
1. **Demo Login:** Arjun Verma persona loads instantly with ₹22k surplus, 44% savings rate, and sample records.
2. **Sign Out:** Application clears session and returns cleanly to Auth Page.
3. **Registration & Duplicate Rejection:** Case-insensitive duplicate email detection correctly blocks collision.
4. **Onboarding Wizard:** First-time personal users complete the 4-step wizard; data is persisted and an initial plan is synthesized.
5. **Data Isolation:** User B cannot read, update, or contribute to User A's expenses or goals (returns 404). Personal users never see demo records.
