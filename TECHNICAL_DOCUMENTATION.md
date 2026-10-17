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

---

## 2. Technology Stack & Tools Used

| Layer / Component | Technology Used | Rationale & Architectural Purpose |
|---|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite | Component-driven reactive architecture with sub-second HMR and full type safety. |
| **Styling & Aesthetics** | Tailwind CSS + Custom CSS Variables | "The Living Ledger" editorial aesthetic inspired by premium wealth journals (Warm Paper `#F6F3EB`, Forest Green `#183D32`, Ink `#202822`, Chartreuse `#D5EE75`, Terracotta `#C66D51`). |
| **Typography** | Google Fonts (*Instrument Serif*, *Plus Jakarta Sans*, *JetBrains Mono*) | High typographic hierarchy with tabular monospaced numbers for financial figures. |
| **Data Visualisation** | Recharts (ResponsiveContainer, BarChart, AreaChart, Pie) | SVG charts for cash-flow waterfalls, category spend distributions, and 12-month wealth simulation curves. |
| **Iconography** | Lucide React | Clean vector iconography for financial transactions, drawers, and status indicators. |
| **Backend Server** | Python 3.12, Flask, Flask-CORS | Modular REST API service handling calculation services, validation, and data serialization. |
| **Database & Persistence**| SQLite (`verdant.db`) | Embedded relational database with schema foreign keys. Ensures persistent state across user sessions with zero external setup. |
| **AI Integration** | Hybrid OpenAI API + Deterministic Fallback | LLM API with an automatic, calibrated deterministic editorial wealth engine when no API key is present. |
| **Quality & Testing** | Python `unittest`, Vite Production Build | Verifies allocation math, surplus ceiling rules, and TypeScript bundle compilation. |

---

## 3. What Was Built: The Five Academic Modules

### Module 1: User and Profile Management
- **Persistent Profile Schema:** Stores user identity, currency preference, take-home monthly income, fixed essential commitments, variable monthly expenditures, existing liquid savings, debt obligations, and target savings.
- **Academic Demo Profile (Arjun Verma):** Calibrated with exact presentation values:
  - Monthly Income: **₹50,000**
  - Fixed Essential Outflows: **₹15,000**
  - Variable Outflows: **₹10,000**
  - Separate Debt Obligations: **₹3,000**
  - Existing Liquid Savings: **₹40,000**
  - Initial Net Monthly Surplus: **₹22,000** (44% savings rate)
  - Emergency Runway: **1.6 Months**

### Module 2: Expense Tracking & Categorisation
- **Living Ledger Table:** Tabular transaction log with date, category, description, payment method (UPI, Debit, Credit, Net Banking, Cash), and amount.
- **10-Category Classification:** Housing, Food, Transport, Utilities, Healthcare, Entertainment, Shopping, Debt Payments, Education, Other.
- **Needs vs. Wants Auditing:** Flags transactions as Essential (Needs - 50% benchmark) or Discretionary (Wants - 30% benchmark).
- **CRUD Operations:** Real-time expense addition, modification, and deletion with instant dashboard recalculation.

### Module 3: Financial Goal Management
- **Multi-Horizon Portfolios:** Emergency Fund, Higher Education, Travel, Electronics, Debt Clearance, Custom.
- **Automated Mathematical Gap Analysis:** Computes remaining capital gap, progress percentage, months remaining, and ideal monthly velocity.
- **Surplus Capacity Guard:** Flags milestones when total required monthly contributions exceed verified surplus.
- **Contribution Logger:** Allows logging ad-hoc savings deposits into goals, triggering celebratory completion notifications.

### Module 4: AI-Assisted Strategic Savings Plan Generator (The Core Feature)
- **Guided 7-Stage Analysis Pipeline:** Visibly walks the user through data collection, spending velocity analysis, surplus calculation, priority weighting, deterministic allocation, AI risk analysis, and 12-month simulation.
- **Priority-Weighted Waterfall Allocation:**
  $$\text{Score}_i = \text{PriorityWeight}_i \times \left(\frac{10}{\text{MonthsRemaining}_i + 1}\right)$$
  - High Priority = 3x (Emergency Funds receive +2 extra emergency weight), Medium = 2x, Low = 1x.
  - Guaranteed: $\sum \text{Allocated}_i \le \text{Monthly Surplus}$.
- **12-Month Cumulative Wealth Simulation Roadmap:** Month-by-month portfolio trajectory showing balance growth for each individual goal.
- **Tactical Action Items:** Suggests discretionary expense cuts and concrete 30-day next steps.
- **Persistent Plan Storage:** Enables saving, activating, and recalling generated strategies.

### Module 5: Savings Progress Monitoring & Plan Adjustment
- **Plan Adjustment Diff Engine:** Compares revisions. If the user changes an income or expense parameter, the engine quantifies the exact surplus delta (e.g. $-\text{₹}2,000$), delays in target dates, and allocation shifts.
- **In-App Notifications Drawer:** Persistent alert log for budget thresholds, significant expenditures, and milestone accomplishments.

---

## 4. Key Mathematical Formulations

1. **Monthly Net Surplus:**
   $$\text{Surplus} = \text{Monthly Income} - (\text{Fixed Expenses} + \text{Variable Expenses}) - \text{Debt Obligations}$$
2. **Effective Savings Rate:**
   $$\text{Savings Rate} (\%) = \left(\frac{\text{Recommended Monthly Savings}}{\text{Monthly Income}}\right) \times 100$$
3. **Emergency Runway:**
   $$\text{Runway (Months)} = \frac{\text{Existing Savings}}{\text{Total Monthly Expenses}}$$
4. **Goal Monthly Demand:**
   $$\text{Required Monthly} = \frac{\text{Target Amount} - \text{Current Amount}}{\max(1, \text{Months to Target Date})}$$

---

## 5. What Could Be Improved Upon (Future Scope)

While VERDANT satisfies and exceeds all PT1 academic requirements, the following enhancements represent natural evolutions for commercial or post-academic deployment:

1. **Automated Bank Feed Integration (Account Aggregator / Plaid / Setu):**
   - *Current State:* Transactions and baseline amounts are user-logged or seeded.
   - *Improvement:* Ingest real-time bank statements via India's RBI Account Aggregator framework or Plaid/SaltEdge APIs, eliminating manual transaction logging.

2. **Inflation & Dynamic Multi-Asset Yield Modeling:**
   - *Current State:* Assumes constant purchasing power across the 12-month simulation.
   - *Improvement:* Introduce inflation rate sliders (e.g., 6% CPI) and asset-class expected returns (Liquid Funds, Fixed Deposits, Index Mutual Funds, Gold) to model real post-tax returns.

3. **Machine Learning Merchant Categorization (Local NLP / Embeddings):**
   - *Current State:* Categorization relies on user selection and keyword matching.
   - *Improvement:* Implement a lightweight local embedding model (e.g., FastText or Sentence-Transformers) to automatically normalize messy transaction SMS/UPI strings (e.g., `UPI/239102/SWIGGY_BANGALORE` $\rightarrow$ `Food`).

4. **Multi-User Authentication & JWT Security:**
   - *Current State:* Built around a 1-click academic demo profile with scrypt password hashing.
   - *Improvement:* Implement JWT bearer token authentication, OAuth2 (Google/GitHub login), role-based permissions, and end-to-end payload encryption for production multi-tenancy.

5. **External Push Alerts & Messaging Bots:**
   - *Current State:* Notifications are presented via an in-app drawer.
   - *Improvement:* Connect to Web Push, Telegram, or WhatsApp Business APIs to send proactive weekly spending digests and mid-month budget warnings.
