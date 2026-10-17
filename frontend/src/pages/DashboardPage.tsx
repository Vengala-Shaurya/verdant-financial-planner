import React from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ShieldCheck,
  Calendar,
  Sparkles,
  ChevronRight,
  Receipt
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart as RechartsPie,
  Pie
} from 'recharts';
import { DashboardOverview } from '../types';

interface DashboardPageProps {
  data: DashboardOverview | null;
  onNavigateTab: (tab: string) => void;
  currency: string;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  Housing: '#183D32',
  Food: '#A8B9A0',
  Utilities: '#5C7A68',
  Transport: '#345243',
  Healthcare: '#7D9686',
  Entertainment: '#D5EE75',
  Shopping: '#E2E8D8',
  'Debt Payments': '#C66D51',
  Education: '#8BA188',
  Other: '#B6BFB2'
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ data, onNavigateTab, currency = '₹' }) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-96 text-sm text-[#202822]/60">
        Loading living financial ledger...
      </div>
    );
  }

  const { financial_health, category_breakdown, goals_summary, recent_expenses, user, has_active_plan } = data;

  const cashFlowData = [
    { name: 'Income', amount: financial_health.income, fill: '#183D32' },
    { name: 'Fixed Needs', amount: financial_health.fixed_expenses, fill: '#5C7A68' },
    { name: 'Variable', amount: financial_health.variable_expenses, fill: '#A8B9A0' },
    { name: 'Debt Repay', amount: financial_health.debt_obligations, fill: '#C66D51' },
    { name: 'Net Surplus', amount: Math.max(0, financial_health.monthly_surplus), fill: '#D5EE75' }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Editorial Banner */}
      <div className="border-b border-[#D8DCD1] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono-num uppercase tracking-widest text-[#202822]/60 font-semibold">
            Module 1 & 5 · Consolidated Financial Overview
          </span>
          <h1 className="text-4xl md:text-5xl font-editorial font-medium text-[#183D32] mt-1 tracking-tight">
            The Living Ledger
          </h1>
          <p className="text-sm text-[#202822]/70 mt-1.5 max-w-2xl font-light">
            Real-time capital ledger synthesizing verified monthly income, essential outflows, debt commitments, and rule-based savings allocations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateTab('expenses')}
            className="px-3.5 py-2 text-xs border border-[#D8DCD1] bg-[#FFFEFA] text-[#183D32] hover:bg-[#F6F3EB] rounded-sm font-medium transition-colors flex items-center space-x-1.5"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
          <button
            onClick={() => onNavigateTab('plan')}
            className="px-4 py-2 text-xs bg-[#183D32] text-[#D5EE75] hover:bg-[#183D32]/90 rounded-sm font-semibold transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Savings Plan</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Quadrant */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Monthly Income */}
        <div className="bg-[#FFFEFA] p-5 border border-[#D8DCD1] subtle-paper-shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-[#202822]/60 text-xs font-mono-num uppercase tracking-wider">
            <span>Take-Home Income</span>
            <Wallet className="w-4 h-4 text-[#183D32]" />
          </div>
          <div className="text-3xl font-mono-num font-semibold text-[#183D32] mt-3">
            {currency}{financial_health.income.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-[#202822]/60 mt-1">Verified monthly net inflow</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#183D32]" />
        </div>

        {/* Metric 2: Monthly Expenses */}
        <div className="bg-[#FFFEFA] p-5 border border-[#D8DCD1] subtle-paper-shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-[#202822]/60 text-xs font-mono-num uppercase tracking-wider">
            <span>Total Monthly Outflow</span>
            <ArrowDownRight className="w-4 h-4 text-[#C66D51]" />
          </div>
          <div className="text-3xl font-mono-num font-semibold text-[#202822] mt-3">
            {currency}{(financial_health.total_expenses + financial_health.debt_obligations).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-[#202822]/60 mt-1">
            Fixed {currency}{financial_health.fixed_expenses.toLocaleString('en-IN')} + Var {currency}{financial_health.variable_expenses.toLocaleString('en-IN')} + Debt {currency}{financial_health.debt_obligations.toLocaleString('en-IN')}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C66D51]" />
        </div>

        {/* Metric 3: Net Monthly Surplus */}
        <div className="bg-[#FFFEFA] p-5 border border-[#D8DCD1] subtle-paper-shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-[#202822]/60 text-xs font-mono-num uppercase tracking-wider">
            <span>Available Monthly Surplus</span>
            <ArrowUpRight className="w-4 h-4 text-[#183D32]" />
          </div>
          <div className="text-3xl font-mono-num font-semibold text-[#183D32] mt-3">
            {currency}{financial_health.monthly_surplus.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center space-x-1.5 mt-1">
            <span className="px-1.5 py-0.2 bg-[#D5EE75] text-[#183D32] text-[10px] font-bold rounded font-mono-num">
              {financial_health.savings_rate}% RATE
            </span>
            <span className="text-[11px] text-[#202822]/60 font-mono-num">Deployable capacity</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#D5EE75]" />
        </div>

        {/* Metric 4: Goal Portfolio Status */}
        <div className="bg-[#FFFEFA] p-5 border border-[#D8DCD1] subtle-paper-shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-[#202822]/60 text-xs font-mono-num uppercase tracking-wider">
            <span>Goal Capital Progress</span>
            <TrendingUp className="w-4 h-4 text-[#183D32]" />
          </div>
          <div className="text-3xl font-mono-num font-semibold text-[#183D32] mt-3">
            {goals_summary.completion_pct}%
          </div>
          <p className="text-[11px] text-[#202822]/60 mt-1 font-mono-num">
            {currency}{goals_summary.total_saved.toLocaleString('en-IN')} / {currency}{goals_summary.total_target.toLocaleString('en-IN')} ({goals_summary.active_count} goals)
          </p>
          <div className="w-full bg-[#D8DCD1] h-1 mt-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#183D32] h-full transition-all duration-500"
              style={{ width: `${Math.min(100, goals_summary.completion_pct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Asymmetric Core Section: Cash-Flow Breakdown + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cash Flow Distribution Chart */}
        <div className="lg:col-span-7 bg-[#FFFEFA] p-6 border border-[#D8DCD1] subtle-paper-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
                Waterfall Liquidity Architecture
              </span>
              <h2 className="text-xl font-editorial font-semibold text-[#183D32]">
                Monthly Income & Capital Outflows
              </h2>
            </div>
            <span className="text-xs font-mono-num text-[#202822]/60">Verified Balance</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#202822' }} stroke="#D8DCD1" />
                <YAxis tick={{ fontSize: 10, fill: '#202822' }} stroke="#D8DCD1" tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#FFFEFA', borderColor: '#D8DCD1', fontSize: 12 }}
                />
                <Bar dataKey="amount" radius={[2, 2, 0, 0]}>
                  {cashFlowData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#D8DCD1] mt-2 text-center">
            <div className="p-2 bg-[#F6F3EB]">
              <span className="text-[10px] text-[#202822]/60 uppercase tracking-wider block font-mono-num">
                Emergency Runway
              </span>
              <span className="text-sm font-semibold font-mono-num text-[#183D32]">
                {financial_health.emergency_runway_months} Months
              </span>
            </div>
            <div className="p-2 bg-[#F6F3EB]">
              <span className="text-[10px] text-[#202822]/60 uppercase tracking-wider block font-mono-num">
                50/30/20 Target Needs
              </span>
              <span className="text-sm font-semibold font-mono-num text-[#202822]">
                {currency}{financial_health.benchmarks.needs_50.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-2 bg-[#F6F3EB]">
              <span className="text-[10px] text-[#202822]/60 uppercase tracking-wider block font-mono-num">
                50/30/20 Savings Target
              </span>
              <span className="text-sm font-semibold font-mono-num text-[#183D32]">
                {currency}{financial_health.benchmarks.savings_20.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="lg:col-span-5 bg-[#FFFEFA] p-6 border border-[#D8DCD1] subtle-paper-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
                  Module 2 · Categorisation
                </span>
                <h2 className="text-xl font-editorial font-semibold text-[#183D32]">
                  Spending Composition
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('expenses')}
                className="text-xs text-[#183D32] hover:underline flex items-center"
              >
                <span>Ledger</span>
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            <div className="space-y-3">
              {category_breakdown.length === 0 ? (
                <p className="text-xs text-[#202822]/50 italic">No expenses logged yet.</p>
              ) : (
                category_breakdown.slice(0, 5).map((cat) => {
                  const pct = Math.round((cat.total / (financial_health.total_expenses || 1)) * 100);
                  const color = CATEGORY_COLORS[cat.category] || '#183D32';
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-[#202822]">{cat.category}</span>
                        <span className="font-mono-num text-[#202822]/80">
                          {currency}{cat.total.toLocaleString('en-IN')} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#D8DCD1] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#D8DCD1] bg-[#FBF9F4] p-3 text-xs leading-relaxed text-[#202822]/80">
            <span className="font-semibold text-[#183D32]">Planning Insight: </span>
            {financial_health.savings_rate >= 30
              ? 'Your high savings rate allows aggressive parallel milestone funding.'
              : 'Discretionary outflows can be pruned to protect goal deadlines.'}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Transactions & Active Plan Context */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Ledger Transactions */}
        <div className="lg:col-span-8 bg-[#FFFEFA] p-6 border border-[#D8DCD1] subtle-paper-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
                Live Audit Trail
              </span>
              <h2 className="text-xl font-editorial font-semibold text-[#183D32]">
                Recent Ledger Transactions
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('expenses')}
              className="text-xs text-[#183D32] hover:underline flex items-center"
            >
              <span>View full ledger</span>
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#D8DCD1] text-[#202822]/60 font-mono-num uppercase tracking-wider">
                  <th className="py-2.5 font-medium">Date</th>
                  <th className="py-2.5 font-medium">Description</th>
                  <th className="py-2.5 font-medium">Category</th>
                  <th className="py-2.5 font-medium">Payment</th>
                  <th className="py-2.5 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8DCD1]/60">
                {recent_expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#202822]/50 italic">
                      No expenses in ledger. Click "Record Expense" to begin.
                    </td>
                  </tr>
                ) : (
                  recent_expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[#F6F3EB]/60 transition-colors">
                      <td className="py-2.5 font-mono-num text-[#202822]/70">{exp.date}</td>
                      <td className="py-2.5 font-medium text-[#202822]">{exp.description}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-medium bg-[#F6F3EB] text-[#183D32] border border-[#D8DCD1]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-2.5 text-[#202822]/70 font-mono-num">{exp.payment_method}</td>
                      <td className="py-2.5 text-right font-mono-num font-semibold text-[#202822]">
                        {currency}{Number(exp.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Plan Status Card */}
        <div className="lg:col-span-4 bg-[#183D32] text-[#FFFEFA] p-6 border border-[#183D32] subtle-paper-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#D5EE75] text-[10px] font-mono-num uppercase tracking-wider font-semibold">
              <span>Savings Strategy Status</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-2xl font-editorial font-medium mt-3 text-[#FFFEFA]">
              {has_active_plan ? 'Personalised Plan Active' : 'No Active Plan Generated'}
            </h3>
            <p className="text-xs text-[#FFFEFA]/80 mt-2 leading-relaxed font-light">
              {has_active_plan
                ? 'Your priority-weighted goal allocations are active. Review your 12-month simulation roadmap and 30-day tactical steps.'
                : 'Run our deterministic financial analysis engine to synthesize surplus allocations across your goals.'}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#FFFEFA]/20 space-y-3">
            <button
              onClick={() => onNavigateTab('plan')}
              className="w-full py-2.5 px-4 bg-[#D5EE75] text-[#183D32] hover:bg-[#D5EE75]/90 font-semibold text-xs rounded-sm transition-colors flex items-center justify-center space-x-1.5"
            >
              <span>{has_active_plan ? 'Inspect & Adjust Plan' : 'Generate Personalised Plan'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('methodology')}
              className="w-full text-center text-[11px] text-[#D5EE75]/80 hover:text-[#D5EE75] font-mono-num underline"
            >
              Inspect PT1 Mathematical Model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
