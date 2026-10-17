import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Target,
  Sparkles,
  Info,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { UserProfile } from '../types';

interface OnboardingPageProps {
  user: UserProfile;
  onComplete: (user: UserProfile) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 4;

  // Step 1: Basic Profile & Currency
  const [userName, setUserName] = useState<string>(user.name || '');
  const [currency, setCurrency] = useState<string>(user.currency || 'INR');

  // Step 2: Monthly Financial Baseline
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [fixedExpenses, setFixedExpenses] = useState<string>('');
  const [variableExpenses, setVariableExpenses] = useState<string>('');
  const [existingSavings, setExistingSavings] = useState<string>('0');
  const [debtObligations, setDebtObligations] = useState<string>('0');
  const [debtInFixed, setDebtInFixed] = useState<boolean>(false);

  // Step 3: Initial Financial Goal
  const [goalName, setGoalName] = useState<string>('Emergency Cushion');
  const [goalCategory, setGoalCategory] = useState<string>('Emergency Fund');
  const [goalTarget, setGoalTarget] = useState<string>('');
  const [goalCurrent, setGoalCurrent] = useState<string>('0');
  const [goalTargetDate, setGoalTargetDate] = useState<string>('2026-12-31');
  const [goalPriority, setGoalPriority] = useState<string>('High');

  // Status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Presets for goals
  const goalPresets = [
    { name: 'Emergency Cushion', category: 'Emergency Fund', priority: 'High', defaultAmount: '100000' },
    { name: 'Higher Education / Certifications', category: 'Education', priority: 'High', defaultAmount: '150000' },
    { name: 'Travel & Exploration', category: 'Travel', priority: 'Medium', defaultAmount: '50000' },
    { name: 'Vehicle / Laptop Upgrade', category: 'Major Purchase', priority: 'Medium', defaultAmount: '80000' },
    { name: 'Debt Accelerated Repayment', category: 'Debt Repayment', priority: 'High', defaultAmount: '60000' },
  ];

  const handleApplyPreset = (preset: typeof goalPresets[0]) => {
    setGoalName(preset.name);
    setGoalCategory(preset.category);
    setGoalPriority(preset.priority);
    if (!goalTarget) {
      setGoalTarget(preset.defaultAmount);
    }
  };

  // Calculations for Step 4 Preview
  const inc = parseFloat(monthlyIncome) || 0;
  const fix = parseFloat(fixedExpenses) || 0;
  const vari = parseFloat(variableExpenses) || 0;
  const debt = parseFloat(debtObligations) || 0;
  const effDebt = debtInFixed ? 0 : debt;
  const calculatedSurplus = Math.max(0, inc - fix - vari - effDebt);
  const savingsRate = inc > 0 ? ((calculatedSurplus / inc) * 100).toFixed(1) : '0';

  const validateCurrentStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!userName.trim()) {
        setErrorMsg('Please enter your preferred display name.');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (inc <= 0) {
        setErrorMsg('Please enter a valid monthly take-home income greater than zero.');
        return false;
      }
      if (fix < 0 || vari < 0 || debt < 0) {
        setErrorMsg('Expense and debt figures cannot be negative.');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!goalName.trim()) {
        setErrorMsg('Please enter a name for your initial goal.');
        return false;
      }
      const tgt = parseFloat(goalTarget) || 0;
      if (tgt <= 0) {
        setErrorMsg('Please set a target goal amount greater than zero.');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((prev) => Math.min(totalSteps, prev + 1));
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinalSubmit = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      // 1. Submit onboarding profile & initial goal
      const res = await api.submitOnboarding({
        monthly_income: inc,
        fixed_expenses: fix,
        variable_expenses: vari,
        existing_savings: parseFloat(existingSavings) || 0,
        debt_obligations: debt,
        debt_in_fixed: debtInFixed,
        currency,
        initial_goal: {
          name: goalName,
          category: goalCategory,
          target_amount: parseFloat(goalTarget) || 0,
          current_amount: parseFloat(goalCurrent) || 0,
          target_date: goalTargetDate,
          priority: goalPriority
        }
      });

      // 2. Automatically generate and persist initial plan
      try {
        const planRes = await api.generatePlan();
        if (planRes && planRes.plan) {
          await api.savePlan(planRes.plan);
        }
      } catch (e) {
        console.warn('Initial plan auto-generation error (non-blocking):', e);
      }

      onComplete(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete onboarding. Please check your inputs.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#202822] flex flex-col justify-between selection:bg-[#D5EE75] selection:text-[#183D32]">
      {/* Header */}
      <header className="border-b border-[#D8DCD1] px-6 lg:px-16 py-4 flex items-center justify-between bg-[#FFFEFA]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 bg-[#183D32] text-[#D5EE75] flex items-center justify-center font-editorial font-bold text-lg rounded-sm">
            V
          </div>
          <span className="font-editorial text-xl tracking-tight text-[#183D32] font-semibold">
            VERDANT
          </span>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono-num text-[#202822]/70">
          <span>Personal Account Setup</span>
          <span className="px-2 py-0.5 bg-[#D5EE75] text-[#183D32] font-bold rounded">
            Step {step} of {totalSteps}
          </span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-[#D8DCD1] h-1">
        <div
          className="bg-[#183D32] h-full transition-all duration-300"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* Main Content Form */}
      <main className="max-w-3xl mx-auto px-6 py-10 flex-1 flex flex-col justify-center w-full">
        <div className="bg-[#FFFEFA] p-8 md:p-10 border border-[#D8DCD1] subtle-paper-shadow rounded-sm">
          
          {errorMsg && (
            <div className="mb-6 p-3.5 bg-[#FDF3F0] border border-[#C66D51]/30 rounded-xs flex items-start space-x-2.5 text-xs text-[#C66D51]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Basic Profile */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
                  Step 1 · Identity & Ledger Settings
                </span>
                <h2 className="text-3xl font-editorial font-normal text-[#183D32] mt-1">
                  Welcome to Your Personal Living Ledger
                </h2>
                <p className="text-xs text-[#202822]/80 mt-1 leading-relaxed">
                  VERDANT uses these baseline details to personalize your financial models and currency formatting.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1.5 font-medium">
                    What should we call you?
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Priyanjali Roy"
                    className="w-full px-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1.5 font-medium">
                    Ledger Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors"
                  >
                    <option value="INR">₹ INR — Indian Rupee (Default)</option>
                    <option value="USD">$ USD — US Dollar</option>
                    <option value="EUR">€ EUR — Euro</option>
                    <option value="GBP">£ GBP — British Pound</option>
                  </select>
                </div>

                <div className="p-3.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822]/70">
                  <p className="font-semibold text-[#183D32] mb-1">Guaranteed Isolation:</p>
                  <p>Your records start empty. No fictional expenses or allocations from the Arjun Verma demo profile will be copied into this account.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Monthly Financial Baseline */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
                  Step 2 · Cash Flow Fundamentals
                </span>
                <h2 className="text-3xl font-editorial font-normal text-[#183D32] mt-1">
                  Your Monthly Financial Baseline
                </h2>
                <p className="text-xs text-[#202822]/80 mt-1 leading-relaxed">
                  VERDANT’s deterministic engine calculates your exact surplus before planning any goal allocations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1 font-medium">
                    Monthly Take-Home Income ({currency}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="e.g. 60000"
                    className="w-full px-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors font-mono-num"
                  />
                  <span className="text-[10px] text-[#202822]/60 mt-0.5 block">Net earnings credited to your accounts each month after tax.</span>
                </div>

                <div>
                  <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1 font-medium">
                    Fixed Monthly Expenses ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={fixedExpenses}
                    onChange={(e) => setFixedExpenses(e.target.value)}
                    placeholder="e.g. 20000 (Rent, Utilities, Insurance)"
                    className="w-full px-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1 font-medium">
                    Variable Monthly Expenses ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={variableExpenses}
                    onChange={(e) => setVariableExpenses(e.target.value)}
                    placeholder="e.g. 12000 (Food, Leisure, Shopping)"
                    className="w-full px-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1 font-medium">
                    Existing Liquid Savings ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={existingSavings}
                    onChange={(e) => setExistingSavings(e.target.value)}
                    placeholder="0 if just getting started"
                    className="w-full px-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1 font-medium">
                    Monthly Debt / EMI Payments ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={debtObligations}
                    onChange={(e) => setDebtObligations(e.target.value)}
                    placeholder="0 if debt-free"
                    className="w-full px-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors font-mono-num"
                  />
                </div>

                <div className="sm:col-span-2 pt-1">
                  <label className="flex items-center space-x-2 text-xs text-[#202822]/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={debtInFixed}
                      onChange={(e) => setDebtInFixed(e.target.checked)}
                      className="rounded border-[#D8DCD1] text-[#183D32] focus:ring-0"
                    />
                    <span>These debt obligations are already included inside my fixed expenses figure above.</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Initial Goal */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
                  Step 3 · Prioritized Milestones
                </span>
                <h2 className="text-3xl font-editorial font-normal text-[#183D32] mt-1">
                  Establish Your First Financial Goal
                </h2>
                <p className="text-xs text-[#202822]/80 mt-1 leading-relaxed">
                  Select a template or customize your target. You can add more goals later from the Goals Ledger.
                </p>
              </div>

              {/* Goal Presets */}
              <div>
                <span className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-2 font-medium">
                  Quick Templates:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {goalPresets.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className={`p-2.5 text-left text-xs border rounded-xs transition-all ${
                        goalName === p.name
                          ? 'border-[#183D32] bg-[#EAF5D6] font-semibold text-[#183D32]'
                          : 'border-[#D8DCD1] bg-[#F6F3EB] text-[#202822]/80 hover:border-[#183D32]'
                      }`}
                    >
                      <span className="block truncate">{p.name}</span>
                      <span className="text-[10px] text-[#202822]/60 block font-mono-num">{p.category}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1 font-medium">
                    Goal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    placeholder="e.g. 6-Month Emergency Cushion"
                    className="w-full px-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1 font-medium">
                    Category
                  </label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors"
                  >
                    <option value="Emergency Fund">Emergency Fund</option>
                    <option value="Education">Education</option>
                    <option value="Travel">Travel</option>
                    <option value="Major Purchase">Major Purchase</option>
                    <option value="Debt Repayment">Debt Repayment</option>
                    <option value="Custom">Custom Goal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1 font-medium">
                    Target Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    placeholder="e.g. 100000"
                    className="w-full px-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1 font-medium">
                    Amount Already Saved ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={goalCurrent}
                    onChange={(e) => setGoalCurrent(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1 font-medium">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1 font-medium">
                    Priority
                  </label>
                  <select
                    value={goalPriority}
                    onChange={(e) => setGoalPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors"
                  >
                    <option value="High">High (Allocated first)</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Generate */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
                  Step 4 · Verification & Plan Synthesis
                </span>
                <h2 className="text-3xl font-editorial font-normal text-[#183D32] mt-1">
                  Review Your Financial Model
                </h2>
                <p className="text-xs text-[#202822]/80 mt-1 leading-relaxed">
                  Review your numbers. Generating your plan will immediately run the deterministic waterfall calculations.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs space-y-2 font-mono-num text-xs">
                  <span className="font-semibold text-[#183D32] block pb-1 border-b border-[#D8DCD1]">
                    Monthly Cash Flow Baseline
                  </span>
                  <div className="flex justify-between">
                    <span className="text-[#202822]/70">Take-Home:</span>
                    <span className="font-semibold text-[#183D32]">{currency} {inc.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#202822]/70">Fixed Expenses:</span>
                    <span>{currency} {fix.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#202822]/70">Variable Expenses:</span>
                    <span>{currency} {vari.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#202822]/70">Debt Obligations:</span>
                    <span>{currency} {debt.toLocaleString()} {debtInFixed && '(in fixed)'}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#D8DCD1] items-baseline font-bold">
                    <span className="text-[#183D32]">Available Monthly Surplus:</span>
                    <span className="text-sm text-[#183D32]">{currency} {calculatedSurplus.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs space-y-2 font-mono-num text-xs">
                  <span className="font-semibold text-[#183D32] block pb-1 border-b border-[#D8DCD1]">
                    Initial Milestone Target
                  </span>
                  <div className="flex justify-between">
                    <span className="text-[#202822]/70">Goal Name:</span>
                    <span className="font-semibold text-[#183D32] truncate max-w-[150px]">{goalName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#202822]/70">Category:</span>
                    <span>{goalCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#202822]/70">Target Amount:</span>
                    <span>{currency} {parseFloat(goalTarget || '0').toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#202822]/70">Priority:</span>
                    <span>{goalPriority}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#D8DCD1] items-baseline font-bold">
                    <span className="text-[#183D32]">Current Savings Base:</span>
                    <span className="text-sm text-[#183D32]">{currency} {(parseFloat(existingSavings) || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#183D32] text-[#FFFEFA] rounded-xs space-y-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#D5EE75]" />
                  <span className="text-xs uppercase tracking-wider text-[#D5EE75] font-semibold">
                    Synthesis Ready
                  </span>
                </div>
                <p className="text-xs text-[#FFFEFA]/90 leading-relaxed">
                  Upon completion, VERDANT will allocate up to <strong>{currency} {calculatedSurplus.toLocaleString()}</strong> per month toward your goals based on feasibility, simulate a 12-month wealth roadmap, and synthesize personalized action items.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-[#D8DCD1] flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-4 py-2.5 border border-[#D8DCD1] text-[#202822]/80 hover:bg-[#F6F3EB] rounded-sm text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>
            ) : <div />}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-[#183D32] text-[#D5EE75] hover:bg-[#183D32]/90 rounded-sm text-xs font-semibold flex items-center space-x-2 transition-all shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#183D32] text-[#D5EE75] hover:bg-[#183D32]/90 rounded-sm text-xs font-semibold flex items-center space-x-2 transition-all shadow-xs disabled:opacity-60"
              >
                <span>{isSubmitting ? 'Computing Roadmap...' : 'Generate My Personalised Plan'}</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#D8DCD1] bg-[#FFFEFA] px-6 lg:px-16 py-3 text-xs text-[#202822]/60 flex justify-between items-center">
        <span>VERDANT Financial Planning System · Personal Onboarding Flow</span>
        <span className="font-mono-num">Deterministic Surplus Verification</span>
      </footer>
    </div>
  );
};
