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
python backend/app.py
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

## 2. Academic Demonstration Workflow (PT1 Review)

VERDANT includes an integrated academic demo seed account (**Arjun Verma**) calibrated with the baseline metrics specified in the project requirements:
- **Monthly Income:** ₹50,000
- **Fixed Essential Needs:** ₹15,000
- **Variable Expenses:** ₹10,000
- **Debt Obligations:** ₹3,000
- **Existing Savings:** ₹40,000
- **Verified Net Monthly Surplus:** **₹22,000** (44% savings rate)

### Demonstration Step-by-Step:
1. **Welcome Screen (`http://localhost:3000`):**
   - Click **"Build My Savings Plan"** or **"Enter Ledger"**.
2. **Module 1 & 5: The Living Ledger Dashboard (`/dashboard`):**
   - Inspect the verified inflow/outflow metrics, cash-flow waterfall chart, and live audit trail.
3. **Module 2: The Expense Ledger (`/expenses`):**
   - Click **"Record New Outflow"**. Enter an amount (e.g., `₹1,200`), select category (e.g., `Food`), and commit.
   - Notice how category breakdown and net monthly surplus recalculate immediately.
4. **Module 3: Financial Goals (`/goals`):**
   - Review the 3 seeded goals (*Emergency Cushion*, *Executive AI Certification*, *Autumn Travel & Trek*).
   - Click **"+ Add Savings"** on any goal and record a contribution.
   - Try creating a goal with an unrealistic deadline to observe the surplus capacity warning.
5. **Module 4: AI-Assisted Strategic Savings Plan (`/plan`):**
   - Click **"Regenerate Plan"**.
   - Watch the visible **7-stage mathematical analysis experience** in action.
   - Review the priority goal allocation matrix, 12-month forward cumulative roadmap, and editorial commentary.
   - Click **"Save & Activate Plan"** to commit it to the persistent SQLite ledger.
6. **Module 5: Plan Adjustment & Comparison Diff:**
   - Navigate to **"Financial Profile"** (`/profile`).
   - Change Variable Expenses from `10,000` to `12,000` and save.
   - Return to **"AI Savings Plan"** and regenerate.
   - Notice the **Plan Adjustment Diff banner** clearly showing that surplus changed by `-₹2,000` and explaining how goal allocation timelines shifted.
7. **Module Documentation & Methodology (`/methodology`):**
   - Review the complete PPT methodology, mathematical equations, and architectural pipeline documentation directly inside the UI.

---

## 3. Technology Stack & Directory Structure

```
Personalized Savings PROJECT/
├── backend/
│   ├── app.py                      # Flask entry point with CORS & route registration
│   ├── models/
│   │   ├── db.py                   # SQLite schema (users, expenses, goals, plans, notifications)
│   │   └── seed_data.py            # Academic demo seeder (Arjun Verma ₹50k/₹22k profile)
│   ├── routes/
│   │   ├── profile_routes.py       # Auth & profile management
│   │   ├── expense_routes.py       # Ledger transaction CRUD & category breakdown
│   │   ├── goal_routes.py          # Goal management & contribution logger
│   │   ├── plan_routes.py          # Savings plan generation & comparison diffing
│   │   └── dashboard_routes.py     # Aggregated analytics & notifications
│   ├── services/
│   │   ├── analysis_engine.py      # Deterministic waterfall, score weighting, & 12-mo roadmap
│   │   └── ai_service.py           # Hybrid OpenAI / deterministic editorial synthesis engine
│   ├── validators/
│   │   └── schemas.py              # Strict payload bounds and type validation
│   └── tests/
│       └── test_financial_engine.py # Automated mathematical constraint test suite
│
├── frontend/
│   ├── src/
│   │   ├── components/             # Sidebar, NotificationsDrawer, Reusable UI
│   │   ├── pages/                  # Welcome, Dashboard, Expenses, Goals, Plan, Profile, Methodology
│   │   ├── services/api.ts         # Type-safe API client
│   │   ├── types/index.ts          # Shared TypeScript interfaces
│   │   ├── App.tsx                 # Main application state and routing
│   │   └── index.css               # "The Living Ledger" design tokens & typography
│   ├── index.html                  # Editorial typography (Instrument Serif, Plus Jakarta Sans, JetBrains Mono)
│   └── vite.config.ts              # Vite configuration with Tailwind CSS and proxy
└── README.md
```

---

## 4. Engineering Principles & AI Distinction

- **Zero Numerical Hallucination:** The deterministic financial calculation engine in `backend/services/analysis_engine.py` guarantees that total goal allocations never exceed verified net surplus.
- **LLM Contextual Synthesis:** The LLM API (or calibrated fallback) is responsible strictly for behavioral analysis, risk mitigation, and executive commentary—never overriding verified mathematical constraints.
- **No External Paid Dependencies Required:** Works out of the box on any student laptop.
