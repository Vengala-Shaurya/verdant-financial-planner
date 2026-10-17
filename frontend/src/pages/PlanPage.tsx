import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  BookmarkCheck,
  TrendingUp,
  ShieldAlert,
  ChevronRight,
  Calendar,
  Layers,
  Cpu,
  ListChecks,
  AlertOctagon
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { SavingsPlan } from '../types';
import { api } from '../services/api';

interface PlanPageProps {
  currency: string;
  onDataChanged: () => void;
  onOpenAskVerdant?: () => void;
}

export const PlanPage: React.FC<PlanPageProps> = ({ currency = '₹', onDataChanged, onOpenAskVerdant }) => {
  const [activePlan, setActivePlan] = useState<SavingsPlan | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<SavingsPlan | null>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const fetchActivePlan = async () => {
    try {
      const res = await api.getActivePlan(1);
      setActivePlan(res.plan);
      setRevisions(res.revisions);
      if (!generatedPlan && res.plan) {
        setGeneratedPlan(res.plan);
      }
    } catch (err: any) {
      console.error('Failed to load active plan', err);
    }
  };

  useEffect(() => {
    fetchActivePlan();
  }, []);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setSaveSuccess(false);

    const steps = [
      'Collecting and validating financial profiles...',
      'Analyzing fixed obligations vs discretionary velocity...',
      'Calculating true monthly net surplus...',
      'Evaluating priority weighting and target deadlines...',
      'Synthesizing deterministic cash-flow allocation...',
      'Generating AI risk analysis & behavioral mitigation rules...',
      'Compiling 12-month simulation roadmap...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setGenerationStep(i);
      await new Promise((r) => setTimeout(r, 400));
    }

    try {
      const res = await api.generatePlan(1);
      setGeneratedPlan(res.plan);
    } catch (err: any) {
      alert('Plan generation failed: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan) return;
    try {
      await api.savePlan(1, generatedPlan);
      setSaveSuccess(true);
      await fetchActivePlan();
      onDataChanged();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert('Failed to save plan: ' + err.message);
    }
  };

  const displayPlan = generatedPlan || activePlan;
  const aiSynth = displayPlan?.ai_synthesis;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Editorial Header */}
      <div className="border-b border-[#D8DCD1] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono-num uppercase tracking-widest text-[#202822]/60 font-semibold">
            Module 4 · Core AI-Assisted Savings Plan Generator
          </span>
          <h1 className="text-4xl md:text-5xl font-editorial font-medium text-[#183D32] mt-1 tracking-tight">
            Strategic Savings Plan
          </h1>
          <p className="text-sm text-[#202822]/70 mt-1.5 max-w-2xl font-light">
            Priority cash-flow waterfall that allocates capital under verified mathematical constraints. Combines deterministic budgets with contextual LLM strategic advice.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {onOpenAskVerdant && (
            <button
              onClick={onOpenAskVerdant}
              className="px-3.5 py-2.5 border border-[#183D32] bg-[#FFFEFA] text-[#183D32] hover:bg-[#D5EE75]/20 rounded-sm font-semibold text-xs transition-colors flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#183D32]" />
              <span>Ask VERDANT / What-If</span>
            </button>
          )}

          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="px-4 py-2.5 bg-[#183D32] text-[#D5EE75] hover:bg-[#183D32]/90 rounded-sm font-semibold text-xs transition-colors flex items-center space-x-2 shadow-xs disabled:opacity-70"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing...' : 'Regenerate Plan'}</span>
          </button>

          {displayPlan && (
            <button
              onClick={handleSavePlan}
              className="px-4 py-2.5 border border-[#183D32] bg-[#FFFEFA] text-[#183D32] hover:bg-[#D5EE75]/20 rounded-sm font-semibold text-xs transition-colors flex items-center space-x-1.5"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>Save & Activate Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Generation Loading State */}
      {isGenerating && (
        <div className="p-8 bg-[#FFFEFA] border border-[#183D32] subtle-paper-shadow rounded-sm text-center space-y-4 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-[#183D32] text-[#D5EE75] flex items-center justify-center mx-auto">
            <Cpu className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="font-editorial text-2xl font-semibold text-[#183D32]">
              Running Financial Analysis Engine
            </h3>
            <p className="text-xs text-[#202822]/70 font-mono-num mt-1">
              Step {generationStep + 1} of 7: Processing cash flow waterfall...
            </p>
          </div>
          <div className="w-full max-w-md mx-auto bg-[#D8DCD1] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#183D32] h-full transition-all duration-300"
              style={{ width: `${((generationStep + 1) / 7) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="p-4 bg-[#183D32] text-[#D5EE75] rounded-sm flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Plan committed to persistent SQLite ledger. Active recommendations updated.</span>
        </div>
      )}

      {/* Plan Adjustment Comparison Diff (Module 5 Requirement) */}
      {displayPlan?.plan_comparison && (
        <div className="p-4 bg-[#FBF9F4] border border-[#183D32]/40 rounded-sm">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#183D32] uppercase tracking-wider font-mono-num">
            <Layers className="w-4 h-4 text-[#183D32]" />
            <span>Plan Adjustment Diff (Audit Comparison)</span>
          </div>
          <p className="text-xs text-[#202822]/80 mt-1 leading-relaxed">
            {displayPlan.plan_comparison.summary_text}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-[#D8DCD1] text-xs font-mono-num">
            <div>
              <span className="text-[10px] text-[#202822]/60 uppercase block">Previous Surplus</span>
              <span className="text-[#202822]">{currency}{displayPlan.plan_comparison.previous_surplus.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#202822]/60 uppercase block">Current Surplus</span>
              <span className="text-[#183D32] font-semibold">{currency}{displayPlan.plan_comparison.current_surplus.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#202822]/60 uppercase block">Net Difference</span>
              <span className={displayPlan.plan_comparison.surplus_diff >= 0 ? 'text-[#183D32] font-semibold' : 'text-[#C66D51] font-semibold'}>
                {displayPlan.plan_comparison.surplus_diff >= 0 ? '+' : ''}{currency}{displayPlan.plan_comparison.surplus_diff.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#202822]/60 uppercase block">Target Rec. Shift</span>
              <span className="text-[#183D32] font-semibold">
                {displayPlan.plan_comparison.savings_diff >= 0 ? '+' : ''}{currency}{displayPlan.plan_comparison.savings_diff.toLocaleString('en-IN')}/mo
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Warnings & Infeasibility Flags */}
      {displayPlan?.warnings && displayPlan.warnings.length > 0 && (
        <div className="p-4 bg-[#C66D51]/10 border border-[#C66D51] rounded-sm space-y-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#C66D51] uppercase tracking-wider font-mono-num">
            <ShieldAlert className="w-4 h-4" />
            <span>Feasibility & Allocation Constraints</span>
          </div>
          {displayPlan.warnings.map((w, idx) => (
            <p key={idx} className="text-xs text-[#202822]/80 leading-relaxed pl-6">
              • {w}
            </p>
          ))}
        </div>
      )}

      {!displayPlan && !isGenerating && (
        <div className="p-12 bg-[#FFFEFA] border border-[#D8DCD1] text-center">
          <Sparkles className="w-8 h-8 text-[#183D32]/40 mx-auto mb-3" />
          <h3 className="text-2xl font-editorial font-semibold text-[#183D32]">No Plan Generated Yet</h3>
          <p className="text-xs text-[#202822]/60 mt-1 max-w-md mx-auto">
            Click "Regenerate Plan" to analyze your ₹50,000 monthly income and synthesize priority allocations across your goals.
          </p>
          <button
            onClick={handleGeneratePlan}
            className="mt-4 px-4 py-2 bg-[#183D32] text-[#D5EE75] text-xs font-semibold rounded-sm"
          >
            Generate Personalised Plan
          </button>
        </div>
      )}

      {displayPlan && !isGenerating && (
        <>
          {/* Key Allocation Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FFFEFA] p-5 border border-[#D8DCD1] subtle-paper-shadow">
              <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
                Recommended Monthly Savings
              </span>
              <div className="text-3xl font-mono-num font-semibold text-[#183D32] mt-2">
                {currency}{displayPlan.recommended_monthly_savings.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-[#202822]/60 mt-1 block font-mono-num">
                {displayPlan.effective_savings_rate}% of verified income
              </span>
            </div>

            <div className="bg-[#FFFEFA] p-5 border border-[#D8DCD1] subtle-paper-shadow">
              <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
                Verified Monthly Surplus
              </span>
              <div className="text-3xl font-mono-num font-semibold text-[#202822] mt-2">
                {currency}{displayPlan.financial_health.monthly_surplus.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-[#202822]/60 mt-1 block font-mono-num">
                Hard ceiling for allocations
              </span>
            </div>

            <div className="bg-[#FFFEFA] p-5 border border-[#D8DCD1] subtle-paper-shadow">
              <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
                Unallocated Cash Cushion
              </span>
              <div className="text-3xl font-mono-num font-semibold text-[#183D32] mt-2">
                {currency}{displayPlan.unallocated_surplus_buffer.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-[#202822]/60 mt-1 block font-mono-num">
                Retained for monthly volatility
              </span>
            </div>

            <div className="bg-[#FFFEFA] p-5 border border-[#D8DCD1] subtle-paper-shadow">
              <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
                Active Goal Coverage
              </span>
              <div className="text-3xl font-mono-num font-semibold text-[#202822] mt-2">
                {displayPlan.evaluated_goals.length} Goals
              </div>
              <span className="text-xs text-[#202822]/60 mt-1 block font-mono-num">
                100% surplus budget compliant
              </span>
            </div>
          </div>

          {/* AI Feature A: Strategic Synthesis & Allocation Rationales Section */}
          <div className="bg-[#FFFEFA] border border-[#D8DCD1] p-6 subtle-paper-shadow space-y-4">
            <div className="flex items-center justify-between border-b border-[#D8DCD1] pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#183D32]" />
                <h3 className="font-editorial text-2xl font-semibold text-[#183D32]">
                  Editorial Wealth Synthesis
                </h3>
              </div>
              <span className="text-[10px] font-mono-num px-2 py-0.5 rounded-xs bg-[#F6F3EB] text-[#183D32] border border-[#D8DCD1]">
                {aiSynth?.provider || 'Deterministic Engine'}
              </span>
            </div>

            <div className="prose text-xs text-[#202822]/85 leading-relaxed space-y-3 whitespace-pre-line font-light">
              {aiSynth?.narrative}
            </div>

            {/* Structured AI Breakdown: Rationales, Risks, and Observations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {aiSynth?.allocation_rationales && aiSynth.allocation_rationales.length > 0 && (
                <div className="p-3 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs space-y-1.5">
                  <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#183D32] font-bold block flex items-center space-x-1">
                    <ListChecks className="w-3.5 h-3.5 text-[#183D32]" />
                    <span>Allocation Rationales</span>
                  </span>
                  <ul className="space-y-1 text-xs text-[#202822]/80">
                    {aiSynth.allocation_rationales.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSynth?.risks_and_tradeoffs && aiSynth.risks_and_tradeoffs.length > 0 && (
                <div className="p-3 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs space-y-1.5">
                  <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#C66D51] font-bold block flex items-center space-x-1">
                    <AlertOctagon className="w-3.5 h-3.5 text-[#C66D51]" />
                    <span>Identified Risks & Trade-Offs</span>
                  </span>
                  <ul className="space-y-1 text-xs text-[#202822]/80">
                    {aiSynth.risks_and_tradeoffs.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#D8DCD1]/60 text-[10px] text-[#202822]/50 font-mono-num">
              Academic Note: Projections and estimates for personal planning only. No fabricated market returns or speculative assertions.
            </div>
          </div>

          {/* Priority Goal Allocation Matrix */}
          <div className="bg-[#FFFEFA] border border-[#D8DCD1] p-6 subtle-paper-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
                  Stage 5 · Rule-Based Distribution
                </span>
                <h3 className="text-xl font-editorial font-semibold text-[#183D32]">
                  Monthly Goal Allocation Matrix
                </h3>
              </div>
              <span className="text-xs font-mono-num text-[#202822]/60">
                Sum of Allocations ≤ Surplus ({currency}{displayPlan.recommended_monthly_savings.toLocaleString('en-IN')} ≤ {currency}{displayPlan.financial_health.monthly_surplus.toLocaleString('en-IN')})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#D8DCD1] bg-[#FBF9F4] text-[#202822]/70 font-mono-num uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-medium">Goal</th>
                    <th className="py-2.5 px-3 font-medium">Priority</th>
                    <th className="py-2.5 px-3 font-medium text-right">Target</th>
                    <th className="py-2.5 px-3 font-medium text-right">Remaining Gap</th>
                    <th className="py-2.5 px-3 font-medium text-right">Ideal Need</th>
                    <th className="py-2.5 px-3 font-medium text-right text-[#183D32]">Recommended Alloc.</th>
                    <th className="py-2.5 px-3 font-medium">Feasibility / Horizon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8DCD1]/60">
                  {displayPlan.evaluated_goals.map((eg) => (
                    <tr key={eg.id} className="hover:bg-[#F6F3EB]/60 transition-colors">
                      <td className="py-3 px-3 font-semibold text-[#183D32]">
                        {eg.name}
                        <span className="block text-[10px] text-[#202822]/50 font-normal">
                          {eg.category} · Due {eg.target_date}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono-num font-semibold bg-[#F6F3EB] text-[#183D32] border border-[#D8DCD1]">
                          {eg.priority} ({eg.priority_weight}x)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num">
                        {currency}{eg.target_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num text-[#202822]/70">
                        {currency}{eg.remaining_gap.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num text-[#202822]/70">
                        {currency}{Math.round(eg.ideal_monthly_req).toLocaleString('en-IN')}/mo
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num font-bold text-[#183D32]">
                        {currency}{Math.round(eg.allocated_monthly).toLocaleString('en-IN')}/mo
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-medium text-[#183D32]">
                          {eg.feasibility}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 12-Month Projected Savings Roadmap Simulation */}
          <div className="bg-[#FFFEFA] border border-[#D8DCD1] p-6 subtle-paper-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
                  Stage 7 · Forward Simulation
                </span>
                <h3 className="text-xl font-editorial font-semibold text-[#183D32]">
                  12-Month Cumulative Wealth Roadmap
                </h3>
              </div>
              <span className="text-xs font-mono-num text-[#183D32] font-semibold">
                Projected +{currency}{(displayPlan.recommended_monthly_savings * 12).toLocaleString('en-IN')} saved
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayPlan.roadmap_12_months} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#183D32" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#183D32" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8DCD1" opacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#202822' }} stroke="#D8DCD1" />
                  <YAxis tick={{ fontSize: 10, fill: '#202822' }} stroke="#D8DCD1" tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Portfolio Value']}
                    contentStyle={{ backgroundColor: '#FFFEFA', borderColor: '#D8DCD1', fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_portfolio_value"
                    stroke="#183D32"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#wealthGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tactical 30-Day Action Items & Suggested Reductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Suggested Reductions */}
            <div className="bg-[#FFFEFA] border border-[#D8DCD1] p-6 subtle-paper-shadow">
              <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
                Expense Optimization
              </span>
              <h3 className="text-xl font-editorial font-semibold text-[#183D32] mt-1 mb-3">
                Suggested Discretionary Trims
              </h3>

              {displayPlan.suggested_reductions.length === 0 ? (
                <p className="text-xs text-[#202822]/60 italic">
                  No critical discretionary leakage detected. Your overhead is within standard parameters.
                </p>
              ) : (
                <div className="space-y-3">
                  {displayPlan.suggested_reductions.map((red, idx) => (
                    <div key={idx} className="p-3 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-[#183D32]">{red.category}</span>
                        <span className="font-mono-num text-[#C66D51] font-semibold">
                          Trim {currency}{red.suggested_trim.toLocaleString('en-IN')}/mo
                        </span>
                      </div>
                      <p className="text-[11px] text-[#202822]/70 mt-1 leading-relaxed">
                        {red.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Next 30-Day Checklist */}
            <div className="bg-[#FFFEFA] border border-[#D8DCD1] p-6 subtle-paper-shadow">
              <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
                Execution Roadmap
              </span>
              <h3 className="text-xl font-editorial font-semibold text-[#183D32] mt-1 mb-3">
                Tactical 30-Day Actions
              </h3>

              <div className="space-y-2.5">
                {(aiSynth?.action_plan_30_days || displayPlan.actions_next_30_days).map((act, idx) => (
                  <div key={idx} className="flex items-start space-x-2.5 text-xs text-[#202822]">
                    <div className="w-4 h-4 rounded-full bg-[#183D32] text-[#D5EE75] flex items-center justify-center font-mono-num text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="leading-relaxed">{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
