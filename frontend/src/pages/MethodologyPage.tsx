import React from 'react';
import {
  BookOpen,
  Cpu,
  Layers,
  ShieldCheck,
  Binary,
  Database,
  ArrowRight,
  TrendingUp,
  Sparkles,
  PieChart
} from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="space-y-10 animate-fade-in pb-16 max-w-5xl">
      {/* Header */}
      <div className="border-b border-[#D8DCD1] pb-6">
        <span className="text-[11px] font-mono-num uppercase tracking-widest text-[#202822]/60 font-semibold">
          Academic Review & System Architecture · PT1
        </span>
        <h1 className="text-4xl md:text-5xl font-editorial font-medium text-[#183D32] mt-1 tracking-tight">
          System Architecture & Financial Methodology
        </h1>
        <p className="text-sm text-[#202822]/70 mt-2 leading-relaxed font-light">
          Formal engineering documentation explaining the end-to-end data pipeline: Input collection, validation, cash flow waterfall calculations, priority-weighted goal allocation, and LLM contextual synthesis.
        </p>
      </div>

      {/* Distinction Alert Box */}
      <div className="p-5 bg-[#FBF9F4] border-l-4 border-[#183D32] border-y border-r border-[#D8DCD1] rounded-xs space-y-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#183D32] uppercase tracking-wider font-mono-num">
          <ShieldCheck className="w-4 h-4 text-[#183D32]" />
          <span>Core Engineering Principle: Transparent Separation of Concerns</span>
        </div>
        <p className="text-xs text-[#202822]/85 leading-relaxed">
          VERDANT strictly distinguishes between <strong>deterministic financial calculations</strong> (mathematical budgets, hard surplus constraints, runway metrics) and <strong>AI-generated explanations</strong>. All allocations are calculated with zero hallucinations in Python; the LLM provides contextual synthesis, behavioral guardrails, and risk rationalization.
        </p>
      </div>

      {/* 5 Modules from PPT Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-editorial font-semibold text-[#183D32]">
          The Five Academic Modules
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-[#FFFEFA] border border-[#D8DCD1] subtle-paper-shadow">
            <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#183D32] font-bold">
              Module 1
            </span>
            <h3 className="text-lg font-editorial font-semibold text-[#183D32] mt-1">
              User & Profile Management
            </h3>
            <p className="text-xs text-[#202822]/70 mt-1.5 leading-relaxed">
              Maintains verified monthly take-home income, fixed baseline obligations, debt payment schedules, existing liquidity reserves, and currency preferences in persistent SQLite storage.
            </p>
          </div>

          <div className="p-5 bg-[#FFFEFA] border border-[#D8DCD1] subtle-paper-shadow">
            <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#183D32] font-bold">
              Module 2
            </span>
            <h3 className="text-lg font-editorial font-semibold text-[#183D32] mt-1">
              Expense Tracking & Categorisation
            </h3>
            <p className="text-xs text-[#202822]/70 mt-1.5 leading-relaxed">
              Maintains a transaction-level double-entry style ledger. Categorises spending across 10 distinct classes with essential (needs) vs discretionary (wants) classification.
            </p>
          </div>

          <div className="p-5 bg-[#FFFEFA] border border-[#D8DCD1] subtle-paper-shadow">
            <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#183D32] font-bold">
              Module 3
            </span>
            <h3 className="text-lg font-editorial font-semibold text-[#183D32] mt-1">
              Financial Goal Management
            </h3>
            <p className="text-xs text-[#202822]/70 mt-1.5 leading-relaxed">
              Tracks multi-horizon milestones (Emergency Funds, Education, Real Estate, Debt Payoff) with dynamic gap auditing, monthly capital velocity, and deadline feasibility checks.
            </p>
          </div>

          <div className="p-5 bg-[#FFFEFA] border border-[#D8DCD1] subtle-paper-shadow">
            <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#183D32] font-bold">
              Module 4
            </span>
            <h3 className="text-lg font-editorial font-semibold text-[#183D32] mt-1">
              AI-Assisted Savings Plan Generator
            </h3>
            <p className="text-xs text-[#202822]/70 mt-1.5 leading-relaxed">
              Core engine running 7 distinct analysis phases. Computes priority weights, allocates surplus within hard liquidity boundaries, simulates a 12-month forward roadmap, and outputs tactical advice.
            </p>
          </div>

          <div className="col-span-full p-5 bg-[#FFFEFA] border border-[#D8DCD1] subtle-paper-shadow">
            <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#183D32] font-bold">
              Module 5
            </span>
            <h3 className="text-lg font-editorial font-semibold text-[#183D32] mt-1">
              Progress Monitoring & Plan Adjustment
            </h3>
            <p className="text-xs text-[#202822]/70 mt-1.5 leading-relaxed">
              Dynamic plan diffing engine that tracks deltas across plan revisions. When income or expenses change, the system quantifies surplus shifts, goal delay variances, and posts budget threshold alerts.
            </p>
          </div>
        </div>
      </div>

      {/* Mathematical Formulation Section */}
      <div className="bg-[#FFFEFA] border border-[#D8DCD1] p-6 subtle-paper-shadow space-y-4">
        <h2 className="text-2xl font-editorial font-semibold text-[#183D32]">
          Deterministic Mathematical Formulations
        </h2>

        <div className="space-y-3 font-mono-num text-xs">
          <div className="p-3 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm">
            <span className="text-[#183D32] font-bold block mb-1">1. Monthly Net Surplus Formulation</span>
            <code className="text-[#202822]">
              Surplus = Monthly_Income - (Fixed_Expenses + Variable_Expenses) - Debt_Obligations
            </code>
            <p className="text-[11px] text-[#202822]/60 mt-1 font-sans">
              Ensures debt obligations are never double counted if already captured within fixed commitments.
            </p>
          </div>

          <div className="p-3 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm">
            <span className="text-[#183D32] font-bold block mb-1">2. Effective Savings Rate</span>
            <code className="text-[#202822]">
              Savings_Rate (%) = (Recommended_Monthly_Savings / Monthly_Income) * 100
            </code>
            <p className="text-[11px] text-[#202822]/60 mt-1 font-sans">
              Benchmarked against classical 50/30/20 guidelines (50% Needs, 30% Wants, 20% Retained Capital).
            </p>
          </div>

          <div className="p-3 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm">
            <span className="text-[#183D32] font-bold block mb-1">3. Goal Priority & Allocation Weighting</span>
            <code className="text-[#202822]">
              Score_i = Priority_Weight_i * (10 / (Months_Remaining_i + 1))
            </code>
            <p className="text-[11px] text-[#202822]/60 mt-1 font-sans">
              Priority weights: High = 3 (Emergency Fund receives +2 extra emergency weight), Medium = 2, Low = 1.
              Allocations are capped at each goal's ideal monthly requirement to avoid overfunding and starving other milestones.
            </p>
          </div>
        </div>
      </div>

      {/* Architectural Flow Diagram */}
      <div className="bg-[#FFFEFA] border border-[#D8DCD1] p-6 subtle-paper-shadow space-y-4">
        <h2 className="text-2xl font-editorial font-semibold text-[#183D32]">
          Data Flow Pipeline
        </h2>

        <div className="p-4 bg-[#183D32] text-[#FFFEFA] rounded-sm font-mono-num text-xs overflow-x-auto space-y-2">
          <p className="text-[#D5EE75] font-bold">// Presentation Architecture Pipeline</p>
          <p>User Input / Ledger Transactions</p>
          <p className="text-[#D5EE75] pl-4">↓ REST API (Flask / Flask-CORS)</p>
          <p>Backend Request Validation (Schema & Bounds Check)</p>
          <p className="text-[#D5EE75] pl-4">↓ SQLite DB Persistence (verdant.db)</p>
          <p>Deterministic Financial Calculation Engine (Surplus & Runway)</p>
          <p className="text-[#D5EE75] pl-4">↓ Priority Weighted Waterfall Allocation</p>
          <p>Contextual AI Synthesis (LLM API / Deterministic Fallback)</p>
          <p className="text-[#D5EE75] pl-4">↓ JSON Plan Payload + Comparison Diff</p>
          <p>Living Ledger React Interface (Interactive Recharts & Reminders)</p>
        </div>
      </div>
    </div>
  );
};
