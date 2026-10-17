import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Edit2,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  TrendingDown
} from 'lucide-react';
import { ExpenseItem, SpendingInsightsResult } from '../types';
import { api } from '../services/api';

interface ExpensePageProps {
  currency: string;
  onDataChanged: () => void;
}

const CATEGORIES = [
  'All',
  'Housing',
  'Food',
  'Transport',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Education',
  'Debt Payments',
  'Other'
];

export const ExpensePage: React.FC<ExpensePageProps> = ({ currency = '₹', onDataChanged }) => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [breakdown, setBreakdown] = useState<{ category: string; total: number; count: number }[]>([]);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // AI Feature B State
  const [spendingInsights, setSpendingInsights] = useState<SpendingInsightsResult | null>(null);
  const [insightsLoading, setInsightsLoading] = useState<boolean>(false);
  const [showAiInsights, setShowAiInsights] = useState<boolean>(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Food',
    description: '',
    payment_method: 'UPI',
    is_essential: true
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const catParam = selectedCategory === 'All' ? undefined : selectedCategory;
      const res = await api.getExpenses(1, catParam, searchQuery || undefined);
      setExpenses(res.expenses);
      setBreakdown(res.category_breakdown);
      setTotalSpent(res.total_spent);
    } catch (err: any) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiSpendingInsights = async () => {
    try {
      setInsightsLoading(true);
      const res = await api.getSpendingInsights(1);
      setSpendingInsights(res.spending_insights);
    } catch (err) {
      console.error('Failed to load AI spending insights', err);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchAiSpendingInsights();
  }, []);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Food',
      description: '',
      payment_method: 'UPI',
      is_essential: true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: ExpenseItem) => {
    setEditingExpense(exp);
    setFormData({
      amount: exp.amount.toString(),
      date: exp.date,
      category: exp.category,
      description: exp.description,
      payment_method: exp.payment_method,
      is_essential: Boolean(exp.is_essential)
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this transaction from the ledger?')) return;
    try {
      await api.deleteExpense(id);
      await fetchExpenses();
      fetchAiSpendingInsights();
      onDataChanged();
    } catch (err: any) {
      alert('Failed to delete expense: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Amount must be a valid number greater than zero.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Please enter a description for the ledger entry.');
      return;
    }

    try {
      if (editingExpense) {
        await api.updateExpense(editingExpense.id, {
          amount: amt,
          date: formData.date,
          category: formData.category,
          description: formData.description,
          payment_method: formData.payment_method,
          is_essential: formData.is_essential
        });
      } else {
        await api.addExpense({
          user_id: 1,
          amount: amt,
          date: formData.date,
          category: formData.category,
          description: formData.description,
          payment_method: formData.payment_method,
          is_essential: formData.is_essential
        });
      }
      setIsModalOpen(false);
      await fetchExpenses();
      fetchAiSpendingInsights();
      onDataChanged();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="border-b border-[#D8DCD1] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono-num uppercase tracking-widest text-[#202822]/60 font-semibold">
            Module 2 · Expense Tracking & Categorisation
          </span>
          <h1 className="text-4xl md:text-5xl font-editorial font-medium text-[#183D32] mt-1 tracking-tight">
            The Expense Ledger
          </h1>
          <p className="text-sm text-[#202822]/70 mt-1.5 max-w-2xl font-light">
            Every transaction committed here dynamically reshapes your cash flow surplus and updates goal feasibility models.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAiSpendingInsights}
            disabled={insightsLoading}
            className="px-3.5 py-2.5 border border-[#183D32] bg-[#FFFEFA] text-[#183D32] hover:bg-[#D5EE75]/20 rounded-sm font-semibold text-xs transition-colors flex items-center space-x-1.5"
          >
            <Sparkles className={`w-3.5 h-3.5 text-[#183D32] ${insightsLoading ? 'animate-spin' : ''}`} />
            <span>Audit Spending AI</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-[#183D32] text-[#D5EE75] hover:bg-[#183D32]/90 rounded-sm font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Outflow</span>
          </button>
        </div>
      </div>

      {/* AI Feature B: Personalised Spending Insights Card */}
      {spendingInsights && (
        <div className="bg-[#FFFEFA] border border-[#183D32]/30 subtle-paper-shadow rounded-sm overflow-hidden">
          <div
            onClick={() => setShowAiInsights(!showAiInsights)}
            className="p-4 bg-[#FBF9F4] border-b border-[#D8DCD1] flex items-center justify-between cursor-pointer hover:bg-[#F6F3EB] transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#183D32]" />
              <h3 className="font-editorial text-lg font-semibold text-[#183D32]">
                Personalised Spending Insights & Velocity Audit
              </h3>
              <span className="text-[10px] font-mono-num px-2 py-0.5 rounded-xs bg-[#FFFEFA] text-[#183D32] border border-[#D8DCD1]">
                {spendingInsights.provider}
              </span>
            </div>
            {showAiInsights ? <ChevronUp className="w-4 h-4 text-[#202822]/60" /> : <ChevronDown className="w-4 h-4 text-[#202822]/60" />}
          </div>

          {showAiInsights && (
            <div className="p-5 space-y-4">
              <p className="text-xs text-[#202822]/90 leading-relaxed font-medium">
                {spendingInsights.spending_assessment}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-[#F6F3EB] rounded-sm border border-[#D8DCD1] space-y-2">
                  <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#183D32] font-bold block">
                    Key Ledger Observations
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#202822]/80">
                    {spendingInsights.key_observations.map((obs, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-[#183D32] font-bold">•</span>
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-[#F6F3EB] rounded-sm border border-[#D8DCD1] space-y-2">
                  <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#183D32] font-bold block">
                    Actionable Discretionary Trims
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#202822]/80">
                    {spendingInsights.actionable_trims.map((trim, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-[#C66D51] shrink-0 mt-0.5" />
                        <span>{trim}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Ledger Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#FFFEFA] p-5 border border-[#D8DCD1] subtle-paper-shadow">
          <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
            Total Logged Outflows
          </span>
          <div className="text-3xl font-mono-num font-semibold text-[#183D32] mt-2">
            {currency}{totalSpent.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-[#202822]/60 mt-1 block">
            Across {expenses.length} recorded items
          </span>
        </div>

        <div className="bg-[#FFFEFA] p-5 border border-[#D8DCD1] subtle-paper-shadow">
          <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
            Top Outflow Category
          </span>
          <div className="text-2xl font-editorial font-semibold text-[#202822] mt-2 truncate">
            {breakdown.length > 0 ? breakdown[0].category : 'None'}
          </div>
          <span className="text-xs text-[#202822]/60 mt-1 block font-mono-num">
            {breakdown.length > 0 ? `${currency}{breakdown[0].total.toLocaleString('en-IN')} (${Math.round((breakdown[0].total / (totalSpent || 1)) * 100)}% of total)` : 'No data'}
          </span>
        </div>

        <div className="bg-[#FFFEFA] p-5 border border-[#D8DCD1] subtle-paper-shadow">
          <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-medium">
            Classification Balance
          </span>
          <div className="text-2xl font-editorial font-semibold text-[#183D32] mt-2">
            Verified Essential Split
          </div>
          <span className="text-xs text-[#202822]/60 mt-1 block font-mono-num">
            Categorised into 50/30 needs vs wants
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFEFA] p-4 border border-[#D8DCD1] subtle-paper-shadow flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-[#202822]/60 shrink-0" />
          <span className="text-xs font-mono-num uppercase tracking-wider text-[#202822]/60 shrink-0">
            Category:
          </span>
          <div className="flex space-x-1">
            {CATEGORIES.slice(0, 7).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-xs transition-colors font-medium shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#183D32] text-[#FFFEFA]'
                    : 'bg-[#F6F3EB] text-[#202822]/80 hover:bg-[#D8DCD1]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-[#202822]/40 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search description or method..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32]"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#FFFEFA] border border-[#D8DCD1] subtle-paper-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#D8DCD1] bg-[#FBF9F4] text-[#202822]/70 font-mono-num uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Description</th>
                <th className="py-3 px-4 font-medium">Category</th>
                <th className="py-3 px-4 font-medium">Payment Mode</th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium text-right">Amount</th>
                <th className="py-3 px-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8DCD1]/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#202822]/50 italic">
                    Reading ledger...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#202822]/50 italic">
                    No transactions match your query. Add a new outflow to verify.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#F6F3EB]/60 transition-colors">
                    <td className="py-3 px-4 font-mono-num text-[#202822]/70 whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#202822]">
                      {exp.description}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-xs text-[10px] font-medium bg-[#F6F3EB] text-[#183D32] border border-[#D8DCD1]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#202822]/70 font-mono-num">
                      {exp.payment_method}
                    </td>
                    <td className="py-3 px-4 font-mono-num text-[11px]">
                      {exp.is_essential ? (
                        <span className="text-[#183D32] font-semibold">Essential (Need)</span>
                      ) : (
                        <span className="text-[#202822]/60">Discretionary (Want)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#202822]">
                      {currency}{Number(exp.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1 text-[#202822]/60 hover:text-[#183D32] rounded transition-colors"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1 text-[#202822]/60 hover:text-[#C66D51] rounded transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-[#202822]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFEFA] w-full max-w-lg border border-[#D8DCD1] shadow-2xl p-6 rounded-sm">
            <h3 className="font-editorial text-2xl font-semibold text-[#183D32] mb-1">
              {editingExpense ? 'Modify Ledger Entry' : 'Record New Outflow'}
            </h3>
            <p className="text-xs text-[#202822]/60 font-mono-num mb-5">
              Enter verified transaction details to update cash flow calculations.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-[#C66D51]/10 border border-[#C66D51] text-[#C66D51] text-xs rounded-sm flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                    Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 2500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full text-sm p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32] font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                    Transaction Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-sm p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32] font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                  Description / Payee *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Produce & Pantry Essentials"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full text-sm p-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-sm focus:outline-none focus:border-[#183D32]"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Net Banking">Net Banking / Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_essential}
                    onChange={(e) => setFormData({ ...formData, is_essential: e.target.checked })}
                    className="rounded text-[#183D32] focus:ring-[#183D32]"
                  />
                  <span className="text-xs text-[#202822]">
                    Mark as non-negotiable essential expenditure (Needs benchmark)
                  </span>
                </label>
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
                  {editingExpense ? 'Save Changes' : 'Commit to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
