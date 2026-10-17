import {
  UserProfile,
  DashboardOverview,
  ExpenseItem,
  GoalItem,
  SavingsPlan,
  InAppNotification
} from '../types';

const API_BASE = '/api';

// Token management in memory / sessionStorage
let authToken: string | null = sessionStorage.getItem('verdant_auth_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    sessionStorage.setItem('verdant_auth_token', token);
  } else {
    sessionStorage.removeItem('verdant_auth_token');
  }
};

export const getAuthToken = () => authToken;

const authHeaders = (customHeaders: Record<string, string> = {}) => {
  const headers: Record<string, string> = { ...customHeaders };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

export const api = {
  // Authentication & Session
  async demoLogin(): Promise<{ user: UserProfile; message: string; token: string }> {
    const res = await fetch(`${API_BASE}/auth/demo-login`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to load demo profile');
    const data = await res.json();
    if (data.token) setAuthToken(data.token);
    return data;
  },

  async login(credentials: { email: string; password: string }): Promise<{ user: UserProfile; message: string; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.errors ? data.errors.join(', ') : 'Sign in failed');
    }
    if (data.token) setAuthToken(data.token);
    return data;
  },

  async register(registrationData: { name: string; email: string; password: string; password_confirm: string }): Promise<{ user: UserProfile; message: string; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.errors ? data.errors.join(', ') : 'Registration failed');
    }
    if (data.token) setAuthToken(data.token);
    return data;
  },

  async getMe(): Promise<{ user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Session invalid or expired');
    return res.json();
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: authHeaders()
      });
    } finally {
      setAuthToken(null);
    }
  },

  async submitOnboarding(data: {
    monthly_income: number;
    fixed_expenses: number;
    variable_expenses: number;
    existing_savings: number;
    debt_obligations: number;
    debt_in_fixed?: boolean;
    currency?: string;
    initial_goal?: {
      name: string;
      category: string;
      target_amount: number;
      current_amount: number;
      target_date: string;
      priority: string;
    };
  }): Promise<{ user: UserProfile; message: string }> {
    const res = await fetch(`${API_BASE}/auth/onboarding`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.errors ? result.errors.join(', ') : 'Failed to complete onboarding');
    }
    return result;
  },

  async getProfile(): Promise<{ user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<{ user: UserProfile; message: string }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(profile)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.errors ? err.errors.join(', ') : 'Failed to update profile');
    }
    return res.json();
  },

  // Dashboard Overview
  async getDashboardOverview(): Promise<DashboardOverview> {
    const res = await fetch(`${API_BASE}/dashboard/overview`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return res.json();
  },

  // Expenses
  async getExpenses(category?: string, search?: string): Promise<{
    expenses: ExpenseItem[];
    category_breakdown: { category: string; total: number; count: number }[];
    total_spent: number;
  }> {
    let url = `${API_BASE}/expenses/`;
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },

  async addExpense(expense: Partial<ExpenseItem>): Promise<{ expense: ExpenseItem; message: string }> {
    const res = await fetch(`${API_BASE}/expenses/`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
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
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(expense)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.errors ? err.errors.join(', ') : 'Failed to update expense');
    }
    return res.json();
  },

  async deleteExpense(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete expense');
    return res.json();
  },

  // Goals
  async getGoals(): Promise<{
    goals: GoalItem[];
    summary: {
      total_target: number;
      total_saved: number;
      overall_progress_pct: number;
      active_goals_count: number;
    };
  }> {
    const res = await fetch(`${API_BASE}/goals/`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch goals');
    return res.json();
  },

  async addGoal(goal: Partial<GoalItem>): Promise<{ goal: GoalItem; message: string }> {
    const res = await fetch(`${API_BASE}/goals/`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
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
      headers: authHeaders({ 'Content-Type': 'application/json' }),
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
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ amount })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record contribution');
    }
    return res.json();
  },

  async deleteGoal(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete goal');
    return res.json();
  },

  // Savings Plans
  async generatePlan(): Promise<{ plan: SavingsPlan; message: string }> {
    const res = await fetch(`${API_BASE}/plans/generate`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({})
    });
    if (!res.ok) throw new Error('Failed to generate savings plan');
    return res.json();
  },

  async savePlan(plan: SavingsPlan): Promise<{ plan_id: number; message: string }> {
    const res = await fetch(`${API_BASE}/plans/save`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ plan })
    });
    if (!res.ok) throw new Error('Failed to save savings plan');
    return res.json();
  },

  async getActivePlan(): Promise<{
    plan: SavingsPlan | null;
    revisions: { id: number; monthly_surplus: number; recommended_savings: number; savings_rate: number; created_at: string; is_active: number }[];
  }> {
    const res = await fetch(`${API_BASE}/plans/active`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch active plan');
    return res.json();
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: InAppNotification[] }> {
    const res = await fetch(`${API_BASE}/dashboard/notifications`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id: number): Promise<void> {
    await fetch(`${API_BASE}/dashboard/notifications/${id}/read`, {
      method: 'PUT',
      headers: authHeaders()
    });
  },

  async markAllNotificationsRead(): Promise<void> {
    await fetch(`${API_BASE}/dashboard/notifications/read-all`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({})
    });
  },

  // AI Integration Features
  async getPlanInsights(plan?: SavingsPlan): Promise<{ insights: any }> {
    const res = await fetch(`${API_BASE}/ai/plan-insights`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ plan })
    });
    if (!res.ok) throw new Error('Failed to fetch AI plan insights');
    return res.json();
  },

  async getSpendingInsights(): Promise<{ spending_insights: any }> {
    const res = await fetch(`${API_BASE}/ai/spending-insights`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch spending insights');
    return res.json();
  },

  async askVerdant(query: string): Promise<{ response: any }> {
    const res = await fetch(`${API_BASE}/ai/ask`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error('Failed to query Ask VERDANT');
    return res.json();
  },

  async getAiHistory(): Promise<{ history: any[] }> {
    const res = await fetch(`${API_BASE}/ai/history`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch AI chat history');
    return res.json();
  }
};
