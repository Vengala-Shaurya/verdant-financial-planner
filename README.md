# VERDANT — Personal Finance, Intentionally Planned
### Professional Training I Academic Project Deliverable

> **Product Name:** VERDANT  
> **Academic Identity:** AI-Based Personalised Savings and Financial Planning System  
> **Architecture Paradigm:** Deterministic Priority-Weighted Cash-Flow Waterfall with Contextual LLM Synthesis  
> **Interface Paradigm:** “The Living Ledger” — Editorial Financial Planning Studio  

---

## 1. Quick Launch Instructions

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

### Launching the Application
The repository comes configured with independent frontend and backend services:

#### A. Backend (Python Flask + SQLite)
```bash
# In the repository root:
source venv/bin/activate
PYTHONPATH=backend python backend/app.py
```
*Backend runs on `http://localhost:5001` with SQLite database initialized at `backend/verdant.db`.*

#### B. Frontend (React 19, TypeScript, Vite, Tailwind CSS, Recharts)
```bash
# In the frontend directory:
cd frontend
npm run dev
```
*Frontend opens at `http://localhost:3000` with active proxying to port 5001.*

---

## 2. Authentication & Separate Pathways

VERDANT features two completely separate ways to enter the application:

### A. Academic Demo Account — Arjun Verma
- Accessible via the **"Continue as Arjun Verma"** button on the Auth Page.
- Dedicated 1-click entry to the calibrated academic baseline:
  - Monthly Income: **₹50,000**
  - Fixed Outflows: **₹15,000**
  - Variable Outflows: **₹10,000**
  - Separate Debt Obligations: **₹3,000**
  - Existing Liquid Savings: **₹40,000**
  - Verified Net Monthly Surplus: **₹22,000** (44% potential savings rate)
  - Emergency Runway: **1.6 Months**
- Clearly labeled as the **Academic Demo Profile**.
- Quick demo reset mechanism in the sidebar is restricted strictly to Arjun's data.

### B. Personal Accounts & Guided Onboarding
- **Clean Registration:** Users register with Name, Email, and Password. Email uniqueness is strictly enforced with case-insensitive comparison (`LOWER(email)`).
- **PBKDF2 Password Hashing & Signed JWTs:** Passwords are never stored in plaintext. JWTs are passed in `Authorization: Bearer <token>` headers or secure cookies.
- **Guided 4-Step Onboarding:** First-time personal users are guided through:
  1. *Identity & Currency Selection* (INR, USD, EUR, GBP)
  2. *Cash-Flow Fundamentals* (take-home income, fixed/variable obligations, liquid cushion, debt)
  3. *Initial Milestone Setup* (custom or templated goals)
  4. *Review & Synthesis* (immediate surplus verification and plan compilation)
- **Zero Inheritance Guarantee:** Newly registered personal accounts start completely clean. Arjun Verma's demo expenses, goals, or plans are **never** seeded or shown inside a personal user's dashboard.

---

## 3. Strict User-Level Data Isolation

Every private API endpoint enforces `@require_auth` and derives user identity solely from the server-verified session (`g.current_user['id']`):
- `/api/expenses/` — Read/Write scoped to current user.
- `/api/goals/` — Goals, contributions, and progress scoped to current user.
- `/api/plans/` — Deterministic waterfall math uses current user's profile and goals.
- `/api/dashboard/` — Overview metrics and notifications scoped to current user.
- `/api/ai/` — Plan explanations, spending insights, and Ask VERDANT chat history scoped to current user.

Cross-user access attempts result in `404 Not Found / Access Denied`.

---

## 4. The Three AI Features (Authenticated & Scoped)

1. **AI Feature A: Personalised Savings-Plan Explanations (`/api/ai/plan-insights`)**
   - Synthesizes qualitative insights, allocation rationales, and 30-day action items based on the user's verified surplus and deterministic plan.
2. **AI Feature B: Personalised Spending Insights (`/api/ai/spending-insights`)**
   - Audits the user's ledger transactions to surface category velocity, large outflows (≥ ₹5,000), and discretionary trim opportunities.
3. **AI Feature C: Ask VERDANT Conversational What-If Simulation (`/api/ai/ask`, `/api/ai/history`)**
   - Chat assistant capable of parsing natural language hypothetical scenarios (e.g., *"What if my income increases by 10,000?"*), simulating the recalculation in Python without altering persistent database records.
   - Includes automatic deterministic fallback when OpenAI API keys are not configured.

---

## 5. Automated Test Suite

Run the full automated test suite covering financial calculations, AI fallbacks, authentication, duplicate rejection, and cross-user data isolation:

```bash
PYTHONPATH=.:backend ./venv/bin/python -m unittest discover -s backend/tests
```

Results: **13 tests pass (100% success rate)**.
