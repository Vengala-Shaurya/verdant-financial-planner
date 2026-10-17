import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { GoalItem } from '../types';
import { api } from '../services/api';

interface GoalPageProps {
  currency: string;
  monthlySurplus: number;
  onDataChanged: () => void;
  onNavigateToPlan: () => void;
}

const GOAL_CATEGORIES = [
  'Emergency Fund',
  'Education',
  'Travel',
  'Electronics',
  'Debt Repayment',
  'Real Estate',
  'Custom'
];

export const GoalPage: React.FC<GoalPageProps> = ({
  currency = '₹',
  monthlySurplus,
  onDataChanged,
  onNavigateToPlan
}) => {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [summary, setSummary] = useState({
    total_target: 0,
    total_saved: 0,
    overall_progress_pct: 0,
    active_goals_count: 0
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<GoalItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Emergency Fund',
    target_amount: '',
    current_amount: '',
    target_date: '',
    priority: 'High'
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Contribution Modal State
  const [contributeGoal, setContributeGoal] = useState<GoalItem | null>(null);
  const [contributionAmount, setContributionAmount] = useState<string>('');
  const [contributeError, setContributeError] = useState<string | null>(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.getGoals();
      setGoals(res.goals);
      setSummary(res.summary);
    } catch (err: any) {
      console.error('Failed to load goals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setFormData({
      name: '',
      category: 'Emergency Fund',
      target_amount: '',
      current_amount: '0',
      target_date: '2027-04-30',
      priority: 'High'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: GoalItem) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      category: goal.category,
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      target_date: goal.target_date,
      priority: goal.priority
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this financial goal?')) return;
    try {
      await api.deleteGoal(id);
      await fetchGoals();
      onDataChanged();
    } catch (err: any) {
      alert('Failed to delete goal: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const tgt = parseFloat(formData.target_amount);
    const curr = parseFloat(formData.current_amount || '0');

    if (isNaN(tgt) || tgt <= 0) {
      setFormError('Target amount must be a valid number greater than zero.');
      return;
    }
    if (isNaN(curr) || curr < 0) {
      setFormError('Current amount cannot be negative.');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('Please specify a goal name.');
      return;
    }

    try {
      if (editingGoal) {
        await api.updateGoal(editingGoal.id, {
          name: formData.name,
          category: formData.category,
          target_amount: tgt,
          current_amount: curr,
          target_date: formData.target_date,
          priority: formData.priority
        });
      } else {
        await api.addGoal({
          user_id: 1,
          name: formData.name,
          category: formData.category,
          target_amount: tgt,
          current_amount: curr,
          target_date: formData.target_date,
          priority: formData.priority
        });
      }
      setIsModalOpen(false);
      await fetchGoals();
      onDataChanged();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    }
  };

  const handleRecordContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoal) return;
    setContributeError(null);

    const amt = parseFloat(contributionAmount);
    if (isNaN(amt) || amt <= 0) {
      setContributeError('Contribution must be greater than zero.');
      return;
    }

    try {
      await api.contributeToGoal(contributeGoal.id, amt);
      setContributeGoal(null);
      setContributionAmount('');
      await fetchGoals();
      onDataChanged();
    } catch (err: any) {
      setContributeError(err.message || 'Failed to record contribution');
    }
  };

  const totalRequiredMonthly = goals
    .filter((g) => !g.is_completed)
    .reduce((sum, g) => sum + (g.required_monthly || 0), 0);

  const isOvercommitted = totalRequiredMonthly > monthlySurplus && monthlySurplus > 0;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="border-b border-[#D8DCD1] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono-num uppercase tracking-widest text-[#202822]/60 font-semibold">
            Module 3 · Financial Goal Management
          </span>
          <h1 className="text-4xl md:text-5xl font-editorial font-medium text-[#183D32] mt-1 tracking-tight">
            Target Portfolios & Milestones
          </h1>
          <p className="text-sm text-[#202822]/70 mt-1.5 max-w-2xl font-light">
            Each objective is audited against your verified cash flow. The engine computes required monthly contributions and flags unrealistic deadlines.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-[#183D32] text-[#D5EE75] hover:bg-[#183D32]/90 rounded-sm font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Goal</span>
          </button>
        </div>
      </div>

      {/* Target Capacity Warning Banner if Required > Surplus */}
      {isOvercommitted && (
        <div className="p-4 bg-[#C66D51]/10 border border-[#C66D51] rounded-sm flex items-start justify-between gap-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-[#C66D51] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-[#C66D51] uppercase tracking-wider font-mono-num">
                Surplus Capacity Warning
              </h4>
              <p className="text-xs text-[#202822]/80 mt-1">
                Total ideal monthly demand for all active milestones ({currency}{totalRequiredMonthly.toLocaleString('en-IN')}) exceeds your current monthly surplus ({currency}{monthlySurplus.toLocaleString('en-IN')}). Our AI plan generator will apply priority waterfall weighting so you don't overspend.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToPlan}
            className="px-3 py-1.5 bg-[#183D32] text-[#D5EE75] text-xs font-semibold rounded-sm shrink-0 hover:bg-[#183D32]/90 transition-colors"
          >
            Rebalance with AI
          </button>
        </div>
      )}

      {/* Goals Metric Quadrant */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFEFA] p-5 border border-[#D8DCD1] subtle-paper-shadow">
          <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
            Active Milestones
          </span>
          <div className="text-3xl font-mono-num font-semibold text-[#183D32] mt-2">
            {summary.active_goals_count}
          </div>
          <span className="text-xs text-[#202822]/60 mt-1 block">Goals currently being funded</span>
        </div>

        <div className="bg-[#FFFEFA] p-5 border border-[#D8DCD1] subtle-paper-shadow">
          <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
            Total Target Capital
          </span>
          <div className="text-3xl font-mono-num font-semibold text-[#202822] mt-2">
            {currency}{summary.total_target.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-[#202822]/60 mt-1 block font-mono-num">
            {currency}{summary.total_saved.toLocaleString('en-IN')} accumulated
          </span>
        </div>

        <div className="bg-[#FFFEFA] p-5 border border-[#D8DCD1] subtle-paper-shadow">
          <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
            Aggregate Funding Rate
          </span>
          <div className="text-3xl font-mono-num font-semibold text-[#183D32] mt-2">
            {summary.overall_progress_pct}%
          </div>
          <span className="text-xs text-[#202822]/60 mt-1 block font-mono-num">Across all established goals</span>
        </div>

        <div className="bg-[#FFFEFA] p-5 border border-[#D8DCD1] subtle-paper-shadow">
          <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
            Ideal Monthly Inflow
          </span>
          <div className="text-3xl font-mono-num font-semibold text-[#202822] mt-2">
            {currency}{Math.round(totalRequiredMonthly).toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-[#202822]/60 mt-1 block font-mono-num">
            vs {currency}{monthlySurplus.toLocaleString('en-IN')} surplus
          </span>
        </div>
      </div>

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-sm text-[#202822]/50 italic">
            Auditing financial targets...
          </div>
        ) : goals.length === 0 ? (
          <div className="col-span-full bg-[#FFFEFA] p-12 border border-[#D8DCD1] text-center">
            <Target className="w-8 h-8 text-[#183D32]/40 mx-auto mb-3" />
            <h3 className="text-xl font-editorial font-semibold text-[#183D32]">No Goals Established</h3>
            <p className="text-xs text-[#202822]/60 mt-1 max-w-md mx-auto">
              Create your emergency cushion, education milestone, or major asset goals to activate the allocation engine.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-[#183D32] text-[#D5EE75] text-xs font-semibold rounded-sm"
            >
              Establish First Goal
            </button>
          </div>
        ) : (
          goals.map((g) => {
            const isCompleted = Boolean(g.is_completed);
            const isHighPrio = g.priority === 'High';
            return (
              <div
                key={g.id}
                className={`bg-[#FFFEFA] border ${
                  isCompleted ? 'border-[#183D32]/40 bg-[#FBF9F4]' : 'border-[#D8DCD1]'
                } p-6 subtle-paper-shadow flex flex-col justify-between relative`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono-num uppercase tracking-wider px-2 py-0.5 rounded-xs bg-[#F6F3EB] text-[#183D32] border border-[#D8DCD1]">
                      {g.category}
                    </span>
                    <div className="flex items-center space-x-1">
                      <span
                        className={`text-[10px] font-mono-num px-1.5 py-0.5 rounded-xs font-semibold ${
                          isHighPrio
                            ? 'bg-[#183D32] text-[#D5EE75]'
                            : 'bg-[#F6F3EB] text-[#202822]/70'
                        }`}
                      >
                        {g.priority} Priority
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-editorial font-semibold text-[#183D32] mt-3">
                    {g.name}
                  </h3>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-[#202822]/60 font-mono-num">Accumulated</span>
                      <span className="font-mono-num font-semibold text-[#183D32]">
                        {currency}{g.current_amount.toLocaleString('en-IN')} / {currency}{g.target_amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="w-full bg-[#D8DCD1] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#183D32] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, g.completion_pct || 0)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-mono-num text-[#202822]/60 pt-0.5">
                      <span>{g.completion_pct}% Funded</span>
                      <span>Gap: {currency}{(g.remaining_gap || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#D8DCD1]/60 grid grid-cols-2 gap-2 text-xs font-mono-num">
                    <div>
                      <span className="text-[10px] text-[#202822]/60 uppercase tracking-wider block">Target Date</span>
                      <span className="text-[#202822] font-medium">{g.target_date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#202822]/60 uppercase tracking-wider block">Required Monthly</span>
                      <span className="text-[#183D32] font-semibold">
                        {currency}{Math.round(g.required_monthly || 0).toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#D8DCD1] flex items-center justify-between">
                  <button
                    onClick={() => {
                      setContributeGoal(g);
                      setContributionAmount('');
                      setContributeError(null);
                    }}
                    disabled={isCompleted}
                    className={`text-xs px-3 py-1.5 rounded-sm font-semibold transition-colors ${
                      isCompleted
                        ? 'bg-[#D8DCD1] text-[#202822]/40 cursor-not-allowed'
                        : 'bg-[#183D32] text-[#D5EE75] hover:bg-[#183D32]/90'
                    }`}
                  >
                    {isCompleted ? 'Goal Fully Funded' : '+ Add Savings'}
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(g)}
                      className="p-1.5 text-[#202822]/60 hover:text-[#183D32] rounded transition-colors"
                      title="Edit Goal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="p-1.5 text-[#202822]/60 hover:text-[#C66D51] rounded transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Goal Creation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-[#202822]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFEFA] w-full max-w-lg border border-[#D8DCD1] shadow-2xl p-6 rounded-sm">
            <h3 className="font-editorial text-2xl font-semibold text-[#183D32] mb-1">
              {editingGoal ? 'Revise Financial Target' : 'Establish New Financial Goal'}
            </h3>
            <p className="text-xs text-[#202822]/60 font-mono-num mb-5">
              Specify objective, capital requirement, and target deadline.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-[#C66D51]/10 border border-[#C66D51] text-[#C66D51] text-xs rounded-sm flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                  Goal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 6-Month Emergency Cushion"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-sm p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32]"
                  >
                    {GOAL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                    Priority Weight *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full text-sm p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32]"
                  >
                    <option value="High">High (Multiplier 3x)</option>
                    <option value="Medium">Medium (Multiplier 2x)</option>
                    <option value="Low">Low (Multiplier 1x)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                    Target Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 90000"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    className="w-full text-sm p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32] font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                    Initial Saved Amount ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                    className="w-full text-sm p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32] font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                  Target Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  className="w-full text-sm p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32] font-mono-num"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#D8DCD1]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#D8DCD1] text-xs font-medium text-[#202822] hover:bg-[#F6F3EB] rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#183D32] text-[#D5EE75] hover:bg-[#183D32]/90 text-xs font-semibold rounded-sm transition-colors"
                >
                  {editingGoal ? 'Update Target' : 'Establish Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Contribution Modal */}
      {contributeGoal && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-[#202822]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFEFA] w-full max-w-md border border-[#D8DCD1] shadow-2xl p-6 rounded-sm">
            <h3 className="font-editorial text-2xl font-semibold text-[#183D32] mb-1">
              Record Savings Contribution
            </h3>
            <p className="text-xs text-[#202822]/60 font-mono-num mb-4">
              Allocate capital towards: <span className="text-[#183D32] font-bold">{contributeGoal.name}</span>
            </p>

            {contributeError && (
              <div className="mb-4 p-3 bg-[#C66D51]/10 border border-[#C66D51] text-[#C66D51] text-xs rounded-sm">
                {contributeError}
              </div>
            )}

            <form onSubmit={handleRecordContribution} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                  Contribution Amount ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  placeholder="e.g. 5000"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="w-full text-base p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32] font-mono-num"
                />
                <span className="text-[11px] text-[#202822]/60 mt-1 block">
                  Remaining gap to goal: {currency}{(contributeGoal.remaining_gap || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#D8DCD1]">
                <button
                  type="button"
                  onClick={() => setContributeGoal(null)}
                  className="px-4 py-2 border border-[#D8DCD1] text-xs font-medium text-[#202822] hover:bg-[#F6F3EB] rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#183D32] text-[#D5EE75] hover:bg-[#183D32]/90 text-xs font-semibold rounded-sm transition-colors"
                >
                  Confirm Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
