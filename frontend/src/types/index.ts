export interface UserProfile {
  id: number;
  name: string;
  email: string;
  currency: string;
  monthly_income: number;
  fixed_expenses: number;
  variable_expenses: number;
  existing_savings: number;
  debt_obligations: number;
  preferred_savings: number;
  debt_in_fixed?: number | boolean;
  is_onboarded?: number | boolean;
  is_demo?: number | boolean;
}

export interface FinancialHealth {
  income: number;
  fixed_expenses: number;
  variable_expenses: number;
  total_expenses: number;
  debt_obligations: number;
  total_monthly_commitments?: number;
  monthly_surplus: number;
  potential_surplus_rate?: number;
  actual_savings_rate?: number;
  savings_rate?: number;
  emergency_runway_months: number;
  emergency_runway_detailed?: {
    essential_only_months: number;
    including_debt_months: number;
    explanation: string;
  };
  benchmarks: {
    needs_50: number;
    wants_30: number;
    savings_20: number;
    notes?: string;
  };
}

export interface ExpenseItem {
  id: number;
  user_id: number;
  amount: number;
  date: string;
  category: string;
  description: string;
  payment_method: string;
  is_essential: number | boolean;
  created_at?: string;
}

export interface GoalItem {
  id: number;
  user_id: number;
  name: string;
  category: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  priority: string;
  monthly_contribution?: number;
  is_completed: number | boolean;
  remaining_gap?: number;
  completion_pct?: number;
  months_remaining?: number;
  required_monthly?: number;
}

export interface EvaluatedGoal {
  id: number;
  name: string;
  category: string;
  target_amount: number;
  current_amount: number;
  remaining_gap: number;
  target_date: string;
  months_remaining: number;
  ideal_monthly_req: number;
  priority: string;
  priority_weight: number;
  allocated_monthly: number;
  projected_months_to_complete: number | null;
  feasibility: string;
  is_completed?: boolean;
}

export interface RoadmapMonth {
  month: string;
  month_number: number;
  monthly_saved: number;
  total_portfolio_value: number;
  goal_breakdown: {
    goal_id: number;
    name: string;
    balance: number;
    target: number;
    progress_pct: number;
  }[];
}

export interface SuggestedReduction {
  category: string;
  current_spent: number;
  suggested_trim: number;
  rationale: string;
}

export interface SavingsPlan {
  db_id?: number;
  created_at?: string;
  timestamp: string;
  financial_health: FinancialHealth;
  recommended_monthly_savings: number;
  recommended_savings_rate?: number;
  effective_savings_rate: number;
  unallocated_surplus_buffer: number;
  evaluated_goals: EvaluatedGoal[];
  roadmap_12_months: RoadmapMonth[];
  suggested_reductions: SuggestedReduction[];
  warnings: string[];
  actions_next_30_days: string[];
  methodology_note: string;
  ai_synthesis?: {
    mode: string;
    provider: string;
    narrative: string;
    allocation_rationales?: string[];
    spending_observations?: string[];
    discretionary_reductions?: string[];
    risks_and_tradeoffs?: string[];
    action_plan_30_days?: string[];
  };
  plan_comparison?: {
    previous_plan_date: string;
    previous_surplus: number;
    current_surplus: number;
    surplus_diff: number;
    previous_recommended_savings: number;
    current_recommended_savings: number;
    savings_diff: number;
    summary_text: string;
  };
}

export interface InAppNotification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

export interface DashboardOverview {
  user: UserProfile;
  financial_health: FinancialHealth;
  recent_expenses: ExpenseItem[];
  category_breakdown: { category: string; total: number }[];
  goals_summary: {
    total_target: number;
    total_saved: number;
    completion_pct: number;
    active_count: number;
  };
  has_active_plan: boolean;
  unread_notifications_count: number;
}

export interface SpendingInsightsResult {
  mode: string;
  provider: string;
  has_sufficient_history: boolean;
  total_spent: number;
  top_categories: { category: string; amount: number; pct_of_spend: number }[];
  large_expenses: { id: number; description: string; amount: number; category: string; date: string }[];
  large_expense_threshold: number;
  spending_assessment: string;
  key_observations: string[];
  actionable_trims: string[];
}

export interface HypotheticalScenario {
  is_hypothetical: boolean;
  hypothetical_income: number;
  hypothetical_fixed_expenses: number;
  hypothetical_surplus: number;
  surplus_shift: number;
  hypothetical_allocated_savings: number;
  hypothetical_savings_rate: number;
  affected_goals: { name: string; allocated: number; feasibility: string }[];
}

export interface AskVerdantResponse {
  mode: string;
  provider: string;
  answer: string;
  scenario_simulation?: HypotheticalScenario | null;
}

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  scenario_simulation?: HypotheticalScenario | null;
  created_at?: string;
}
