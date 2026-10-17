import {
  UserProfile,
  DashboardOverview,
  ExpenseItem,
  GoalItem,
  SavingsPlan,
  InAppNotification
} from '../types';

const API_BASE = '/api';

export const api = {
  // Demo Login / Profile
  async demoLogin(): Promise<{ user: UserProfile; message: string }> {
    const res = await fetch(`${API_BASE}/auth/demo-login`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to load demo profile');
    return res.json();
  },

  async getProfile(userId = 1): Promise<{ user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/profile?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<{ user: UserProfile; message: string }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.errors ? err.errors.join(', ') : 'Failed to update profile');
    }
    return res.json();
  },

  // Dashboard Overview
  async getDashboardOverview(userId = 1): Promise<DashboardOverview> {
    const res = await fetch(`${API_BASE}/dashboard/overview?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return res.json();
  },

  // Expenses
  async getExpenses(userId = 1, category?: string, search?: string): Promise<{
    expenses: ExpenseItem[];
    category_breakdown: { category: string; total: number; count: number }[];
    total_spent: number;
  }> {
    let url = `${API_BASE}/expenses/?user_id=${userId}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },

  async addExpense(expense: Partial<ExpenseItem>): Promise<{ expense: ExpenseItem; message: string }> {
    const res = await fetch(`${API_BASE}/expenses/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.errors ? err.errors.join(', ') : 'Failed to add expense');
    }
    return res.json();
  },

  async updateExpense(id: number, expense: Partial<ExpenseItem>): Promise<{ expense: ExpenseItem; message: string }> {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.errors ? err.errors.join(', ') : 'Failed to update expense');
    }
    return res.json();
  },

  async deleteExpense(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete expense');
    return res.json();
  },

  // Goals
  async getGoals(userId = 1): Promise<{
    goals: GoalItem[];
    summary: {
      total_target: number;
      total_saved: number;
      overall_progress_pct: number;
      active_goals_count: number;
    };
  }> {
    const res = await fetch(`${API_BASE}/goals/?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch goals');
    return res.json();
  },

  async addGoal(goal: Partial<GoalItem>): Promise<{ goal: GoalItem; message: string }> {
    const res = await fetch(`${API_BASE}/goals/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.errors ? err.errors.join(', ') : 'Failed to create goal');
    }
    return res.json();
  },

  async updateGoal(id: number, goal: Partial<GoalItem>): Promise<{ goal: GoalItem; message: string }> {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.errors ? err.errors.join(', ') : 'Failed to update goal');
    }
    return res.json();
  },

  async contributeToGoal(id: number, amount: number): Promise<{ goal: GoalItem; message: string }> {
    const res = await fetch(`${API_BASE}/goals/${id}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record contribution');
    }
    return res.json();
  },

  async deleteGoal(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/goals/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete goal');
    return res.json();
  },

  // Savings Plans
  async generatePlan(userId = 1): Promise<{ plan: SavingsPlan; message: string }> {
    const res = await fetch(`${API_BASE}/plans/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    if (!res.ok) throw new Error('Failed to generate savings plan');
    return res.json();
  },

  async savePlan(userId = 1, plan: SavingsPlan): Promise<{ plan_id: number; message: string }> {
    const res = await fetch(`${API_BASE}/plans/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, plan })
    });
    if (!res.ok) throw new Error('Failed to save savings plan');
    return res.json();
  },

  async getActivePlan(userId = 1): Promise<{
    plan: SavingsPlan | null;
    revisions: { id: number; monthly_surplus: number; recommended_savings: number; savings_rate: number; created_at: string; is_active: number }[];
  }> {
    const res = await fetch(`${API_BASE}/plans/active?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch active plan');
    return res.json();
  },

  // Notifications
  async getNotifications(userId = 1): Promise<{ notifications: InAppNotification[] }> {
    const res = await fetch(`${API_BASE}/dashboard/notifications?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id: number): Promise<void> {
    await fetch(`${API_BASE}/dashboard/notifications/${id}/read`, { method: 'PUT' });
  },

  async markAllNotificationsRead(userId = 1): Promise<void> {
    await fetch(`${API_BASE}/dashboard/notifications/read-all`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
  },

  // AI Integration Features
  async getPlanInsights(userId = 1, plan?: SavingsPlan): Promise<{ insights: any }> {
    const res = await fetch(`${API_BASE}/ai/plan-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, plan })
    });
    if (!res.ok) throw new Error('Failed to fetch AI plan insights');
    return res.json();
  },

  async getSpendingInsights(userId = 1): Promise<{ spending_insights: any }> {
    const res = await fetch(`${API_BASE}/ai/spending-insights?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch spending insights');
    return res.json();
  },

  async askVerdant(query: string, userId = 1): Promise<{ response: any }> {
    const res = await fetch(`${API_BASE}/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, query })
    });
    if (!res.ok) throw new Error('Failed to query Ask VERDANT');
    return res.json();
  },

  async getAiHistory(userId = 1): Promise<{ history: any[] }> {
    const res = await fetch(`${API_BASE}/ai/history?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch AI chat history');
    return res.json();
  }
};
