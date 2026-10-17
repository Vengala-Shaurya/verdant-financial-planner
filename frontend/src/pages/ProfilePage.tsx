import React, { useState } from 'react';
import {
  User,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../services/api';

interface ProfilePageProps {
  user: UserProfile | null;
  currency: string;
  onProfileUpdated: () => void;
  onNavigateToPlan: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  currency = '₹',
  onProfileUpdated,
  onNavigateToPlan
}) => {
  const [formData, setFormData] = useState({
    name: user?.name || 'Arjun Verma',
    monthly_income: user?.monthly_income?.toString() || '50000',
    fixed_expenses: user?.fixed_expenses?.toString() || '15000',
    variable_expenses: user?.variable_expenses?.toString() || '10000',
    debt_obligations: user?.debt_obligations?.toString() || '3000',
    existing_savings: user?.existing_savings?.toString() || '40000',
    preferred_savings: user?.preferred_savings?.toString() || '15000',
    currency: user?.currency || 'INR'
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronize form when user prop changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        monthly_income: user.monthly_income.toString(),
        fixed_expenses: user.fixed_expenses.toString(),
        variable_expenses: user.variable_expenses.toString(),
        debt_obligations: user.debt_obligations.toString(),
        existing_savings: user.existing_savings.toString(),
        preferred_savings: user.preferred_savings.toString(),
        currency: user.currency || 'INR'
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const inc = parseFloat(formData.monthly_income);
    const fix = parseFloat(formData.fixed_expenses);
    const varExp = parseFloat(formData.variable_expenses);
    const debt = parseFloat(formData.debt_obligations);
    const sav = parseFloat(formData.existing_savings);
    const pref = parseFloat(formData.preferred_savings);

    try {
      await api.updateProfile({
        id: user?.id || 1,
        name: formData.name,
        monthly_income: inc,
        fixed_expenses: fix,
        variable_expenses: varExp,
        debt_obligations: debt,
        existing_savings: sav,
        preferred_savings: pref,
        currency: formData.currency
      });

      setSuccessMsg('Financial profile updated. The savings engine has recalculated your surplus.');
      onProfileUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const calculatedSurplus =
    (parseFloat(formData.monthly_income) || 0) -
    (parseFloat(formData.fixed_expenses) || 0) -
    (parseFloat(formData.variable_expenses) || 0) -
    (parseFloat(formData.debt_obligations) || 0);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="border-b border-[#D8DCD1] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono-num uppercase tracking-widest text-[#202822]/60 font-semibold">
            Module 1 · Profile & Baseline Financial Overview
          </span>
          <h1 className="text-4xl md:text-5xl font-editorial font-medium text-[#183D32] mt-1 tracking-tight">
            Financial Baseline Profile
          </h1>
          <p className="text-sm text-[#202822]/70 mt-1.5 max-w-2xl font-light">
            Adjust your verified income, fixed obligations, or debt payments here. Changing these values immediately triggers plan recalculation recommendations.
          </p>
        </div>

        <button
          onClick={onNavigateToPlan}
          className="px-4 py-2.5 bg-[#183D32] text-[#D5EE75] hover:bg-[#183D32]/90 rounded-sm font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-xs"
        >
          <span>Run AI Plan Generator</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-[#183D32] text-[#D5EE75] rounded-sm flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-[#C66D51]/10 border border-[#C66D51] text-[#C66D51] rounded-sm flex items-center space-x-2 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Container */}
        <div className="lg:col-span-8 bg-[#FFFEFA] border border-[#D8DCD1] p-6 subtle-paper-shadow">
          <h3 className="font-editorial text-2xl font-semibold text-[#183D32] mb-1">
            Core Financial Parameters
          </h3>
          <p className="text-xs text-[#202822]/60 font-mono-num mb-6">
            All numerical inputs are validated on both frontend and Python backend.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-sm p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                  Monthly Take-Home Income ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.monthly_income}
                  onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                  className="w-full text-sm p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32] font-mono-num"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                  Existing Savings / Liquidity ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.existing_savings}
                  onChange={(e) => setFormData({ ...formData, existing_savings: e.target.value })}
                  className="w-full text-sm p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32] font-mono-num"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                  Fixed Essential Outflows (Rent, Utilities, EMI) ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.fixed_expenses}
                  onChange={(e) => setFormData({ ...formData, fixed_expenses: e.target.value })}
                  className="w-full text-sm p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32] font-mono-num"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                  Variable Monthly Outflows (Food, Transit, Leisure) ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.variable_expenses}
                  onChange={(e) => setFormData({ ...formData, variable_expenses: e.target.value })}
                  className="w-full text-sm p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32] font-mono-num"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                  Separate Monthly Debt Obligations ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.debt_obligations}
                  onChange={(e) => setFormData({ ...formData, debt_obligations: e.target.value })}
                  className="w-full text-sm p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32] font-mono-num"
                />
                <span className="text-[10px] text-[#202822]/50 font-mono-num">
                  Not double-counted if already in fixed expenses.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                  Preferred Monthly Target Savings ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.preferred_savings}
                  onChange={(e) => setFormData({ ...formData, preferred_savings: e.target.value })}
                  className="w-full text-sm p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32] font-mono-num"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#D8DCD1] flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-[#183D32] text-[#D5EE75] hover:bg-[#183D32]/90 rounded-sm font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Updating Ledger...' : 'Commit Baseline Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Mathematical Preview Sidepanel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#183D32] text-[#FFFEFA] p-6 subtle-paper-shadow border border-[#183D32]">
            <span className="text-[10px] font-mono-num uppercase tracking-widest text-[#D5EE75] font-semibold">
              Live Mathematical Calculation
            </span>
            <div className="mt-4 space-y-3 font-mono-num text-xs">
              <div className="flex justify-between border-b border-[#FFFEFA]/20 pb-2">
                <span className="text-[#FFFEFA]/70">Take-Home Income</span>
                <span>+{currency}{parseFloat(formData.monthly_income || '0').toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-b border-[#FFFEFA]/20 pb-2 text-[#FFFEFA]/70">
                <span>Fixed Outflows</span>
                <span>-{currency}{parseFloat(formData.fixed_expenses || '0').toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-b border-[#FFFEFA]/20 pb-2 text-[#FFFEFA]/70">
                <span>Variable Outflows</span>
                <span>-{currency}{parseFloat(formData.variable_expenses || '0').toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-b border-[#FFFEFA]/20 pb-2 text-[#FFFEFA]/70">
                <span>Debt Obligations</span>
                <span>-{currency}{parseFloat(formData.debt_obligations || '0').toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-bold text-[#D5EE75]">
                <span>Calculated Surplus</span>
                <span>{currency}{calculatedSurplus.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#FFFEFA]/70 mt-4 leading-relaxed font-light">
              This surplus is the hard ceiling for all goal allocations. If you increase expenses, the plan recalculation warning will trigger immediately.
            </p>
          </div>

          <div className="bg-[#FFFEFA] border border-[#D8DCD1] p-5 subtle-paper-shadow">
            <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
              Academic Demo Values
            </span>
            <p className="text-xs text-[#202822]/80 mt-1 leading-relaxed">
              Default baseline: ₹50,000 income, ₹15,000 fixed, ₹10,000 variable, ₹3,000 debt payments, yielding an initial surplus of ₹22,000 (44% rate).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
