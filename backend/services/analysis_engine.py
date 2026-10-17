from datetime import datetime, date
import json

CATEGORIES_ESSENTIALITY = {
    'housing': True,
    'utilities': True,
    'healthcare': True,
    'debt payments': True,
    'education': True,
    'food': True, # can be partly discretionary, default baseline
    'transport': True,
    'entertainment': False,
    'shopping': False,
    'other': False
}

def calculate_financial_health(income, fixed_expenses, variable_expenses, debt_obligations, existing_savings):
    """
    Core mathematical engine for personal financial indicators.
    Surplus = Income - (Fixed Expenses + Variable Expenses + Debt Obligations)
    """
    total_expenses = fixed_expenses + variable_expenses
    surplus = income - total_expenses - debt_obligations
    
    # 50/30/20 benchmark guideline
    benchmark_needs = income * 0.50
    benchmark_wants = income * 0.30
    benchmark_savings = income * 0.20
    
    savings_rate = (surplus / income * 100) if income > 0 and surplus > 0 else 0.0
    
    # Emergency runway in months
    emergency_runway_months = (existing_savings / total_expenses) if total_expenses > 0 else 0.0

    return {
        'income': round(income, 2),
        'fixed_expenses': round(fixed_expenses, 2),
        'variable_expenses': round(variable_expenses, 2),
        'total_expenses': round(total_expenses, 2),
        'debt_obligations': round(debt_obligations, 2),
        'monthly_surplus': round(surplus, 2),
        'savings_rate': round(savings_rate, 1),
        'emergency_runway_months': round(emergency_runway_months, 1),
        'benchmarks': {
            'needs_50': round(benchmark_needs, 2),
            'wants_30': round(benchmark_wants, 2),
            'savings_20': round(benchmark_savings, 2)
        }
    }

def calculate_goal_allocations(surplus, goals):
    """
    Rule-based deterministic goal priority and surplus allocation engine.
    Priority weights: High = 3, Medium = 2, Low = 1
    Considers target dates, gaps, and surplus budget constraints.
    Ensures total allocations <= monthly surplus.
    """
    today = date.today()
    evaluated_goals = []
    
    total_needed_monthly = 0.0
    
    for g in goals:
        target_amt = float(g.get('target_amount', 0))
        curr_amt = float(g.get('current_amount', 0))
        gap = max(0.0, target_amt - curr_amt)
        target_date_str = g.get('target_date', '')
        
        # Calculate remaining months
        months_left = 1
        if target_date_str:
            try:
                t_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
                days_diff = (t_date - today).days
                months_left = max(1, int(days_diff / 30.4))
            except Exception:
                months_left = 6
        
        ideal_monthly_req = gap / months_left if months_left > 0 else gap
        total_needed_monthly += ideal_monthly_req
        
        priority_str = g.get('priority', 'Medium').capitalize()
        priority_weight = 3 if priority_str == 'High' else (2 if priority_str == 'Medium' else 1)
        
        # Emergency funds get extra priority weight
        if 'emergency' in g.get('name', '').lower() or 'emergency' in g.get('category', '').lower():
            priority_weight += 2
            
        evaluated_goals.append({
            'id': g.get('id'),
            'name': g.get('name'),
            'category': g.get('category', 'Custom'),
            'target_amount': target_amt,
            'current_amount': curr_amt,
            'remaining_gap': round(gap, 2),
            'target_date': target_date_str,
            'months_remaining': months_left,
            'ideal_monthly_req': round(ideal_monthly_req, 2),
            'priority': priority_str,
            'priority_weight': priority_weight,
            'allocated_monthly': 0.0,
            'projected_months_to_complete': None,
            'feasibility': 'Feasible'
        })
    
    if surplus <= 0:
        for eg in evaluated_goals:
            eg['allocated_monthly'] = 0.0
            eg['feasibility'] = 'Unfeasible (Zero or Negative Surplus)'
            eg['projected_months_to_complete'] = None
        return evaluated_goals, 0.0, ["Monthly surplus is zero or negative. Immediate expense reduction or debt restructuring required before funding goals."]

    # Proportional weighted allocation within available surplus
    # If surplus is sufficient to fund all ideal monthly contributions:
    warnings = []
    if surplus >= total_needed_monthly:
        for eg in evaluated_goals:
            eg['allocated_monthly'] = round(eg['ideal_monthly_req'], 2)
            eg['projected_months_to_complete'] = eg['months_remaining']
            eg['feasibility'] = 'On Track (Fully Funded)'
        total_allocated = round(total_needed_monthly, 2)
    else:
        warnings.append(
            f"Available surplus (₹{surplus:,.0f}) is less than ideal total requirement (₹{total_needed_monthly:,.0f}). Prioritising high-impact goals."
        )
        # Weighted distribution
        # Compute combined score: priority_weight * (1 / (months_remaining ** 0.5))
        total_score = sum(eg['priority_weight'] * (10.0 / (eg['months_remaining'] + 1)) for eg in evaluated_goals)
        
        remaining_pool = surplus
        for eg in evaluated_goals:
            score = eg['priority_weight'] * (10.0 / (eg['months_remaining'] + 1))
            ratio = score / total_score if total_score > 0 else 1.0 / len(evaluated_goals)
            suggested = round(surplus * ratio, 2)
            # Cap at ideal monthly requirement so we don't overfund one goal while starving another
            alloc = min(suggested, eg['ideal_monthly_req'])
            eg['allocated_monthly'] = alloc
            remaining_pool -= alloc
            
        # If any surplus remains due to capping, distribute to highest priority goals that still have an ideal gap
        if remaining_pool > 0.5:
            sorted_by_prio = sorted(evaluated_goals, key=lambda x: -x['priority_weight'])
            for eg in sorted_by_prio:
                if remaining_pool <= 0:
                    break
                gap_to_ideal = eg['ideal_monthly_req'] - eg['allocated_monthly']
                if gap_to_ideal > 0:
                    add_alloc = min(remaining_pool, gap_to_ideal)
                    eg['allocated_monthly'] = round(eg['allocated_monthly'] + add_alloc, 2)
                    remaining_pool -= add_alloc
        
        # Calculate projected completion with allocated rate
        for eg in evaluated_goals:
            if eg['allocated_monthly'] > 0:
                proj_months = int(eg['remaining_gap'] / eg['allocated_monthly'] + 0.99)
                eg['projected_months_to_complete'] = proj_months
                if proj_months > eg['months_remaining']:
                    eg['feasibility'] = f"Delayed by {proj_months - eg['months_remaining']} months"
                else:
                    eg['feasibility'] = "Feasible with current allocation"
            else:
                eg['feasibility'] = "Deferred (Insufficient Surplus)"
                eg['projected_months_to_complete'] = None

        total_allocated = round(sum(eg['allocated_monthly'] for eg in evaluated_goals), 2)

    return evaluated_goals, total_allocated, warnings

def build_month_by_month_roadmap(evaluated_goals, months_horizon=12):
    """
    Generates a 12-month forward simulation of cumulative savings across all goals.
    """
    roadmap = []
    current_balances = {eg['id']: eg['current_amount'] for eg in evaluated_goals}
    
    current_month_names = ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6", 
                           "Month 7", "Month 8", "Month 9", "Month 10", "Month 11", "Month 12"]
    
    for m in range(months_horizon):
        month_label = current_month_names[m]
        month_savings = 0.0
        goal_snapshots = []
        
        for eg in evaluated_goals:
            gid = eg['id']
            target = eg['target_amount']
            alloc = eg['allocated_monthly']
            
            # If not yet met target
            if current_balances[gid] < target:
                new_balance = min(target, current_balances[gid] + alloc)
                month_savings += (new_balance - current_balances[gid])
                current_balances[gid] = round(new_balance, 2)
            
            goal_snapshots.append({
                'goal_id': gid,
                'name': eg['name'],
                'balance': current_balances[gid],
                'target': target,
                'progress_pct': round((current_balances[gid] / target * 100), 1) if target > 0 else 100.0
            })
            
        roadmap.append({
            'month': month_label,
            'month_number': m + 1,
            'monthly_saved': round(month_savings, 2),
            'total_portfolio_value': round(sum(current_balances.values()), 2),
            'goal_breakdown': goal_snapshots
        })
        
    return roadmap

def generate_savings_plan_data(user, expenses, goals, custom_prompt=""):
    """
    Orchestrates financial analysis, deterministic allocation, roadmap generation,
    and returns a structured plan object with actionable advice.
    """
    income = float(user.get('monthly_income', 0))
    fixed_exp = float(user.get('fixed_expenses', 0))
    var_exp = float(user.get('variable_expenses', 0))
    debt = float(user.get('debt_obligations', 0))
    savings = float(user.get('existing_savings', 0))
    
    fin_health = calculate_financial_health(income, fixed_exp, var_exp, debt, savings)
    surplus = fin_health['monthly_surplus']
    
    evaluated_goals, total_allocated, warnings = calculate_goal_allocations(surplus, goals)
    roadmap = build_month_by_month_roadmap(evaluated_goals, months_horizon=12)
    
    # Analyze expense breakdown to suggest reductions
    expense_category_totals = {}
    for exp in expenses:
        cat = exp.get('category', 'other').lower()
        expense_category_totals[cat] = expense_category_totals.get(cat, 0.0) + float(exp.get('amount', 0))
        
    suggested_reductions = []
    # Identify discretionary categories with high spend
    for cat in ['entertainment', 'shopping', 'food', 'other']:
        if cat in expense_category_totals and expense_category_totals[cat] > 0.15 * income:
            potential_saving = round(expense_category_totals[cat] * 0.15, 0)
            suggested_reductions.append({
                'category': cat.capitalize(),
                'current_spent': round(expense_category_totals[cat], 2),
                'suggested_trim': potential_saving,
                'rationale': f"Discretionary spending in {cat.capitalize()} accounts for >15% of monthly income. Trimming 15% recovers ₹{potential_saving:,.0f} for goals."
            })
            
    if not suggested_reductions and var_exp > 0.25 * income:
        suggested_reductions.append({
            'category': 'Variable Expenses',
            'current_spent': round(var_exp, 2),
            'suggested_trim': round(var_exp * 0.1, 0),
            'rationale': f"Trimming variable monthly expenses by 10% unlocks ₹{var_exp * 0.1:,.0f}/month towards accelerated emergency cushion."
        })

    # 30-day tactical action items
    actions_next_30_days = [
        f"Automate standing monthly transfer of ₹{total_allocated:,.0f} into dedicated goal sub-accounts right after salary credit.",
        f"Cap non-essential discretionary variable spending at ₹{max(0, var_exp - 1000):,.0f} this billing cycle.",
        "Log every cash or card expenditure daily in the VERDANT expense ledger to detect recurring leakage early."
    ]
    if debt > 0:
        actions_next_30_days.append(f"Ensure debt obligation of ₹{debt:,.0f} is paid on or before the due date to avoid interest compound penalties.")

    plan_summary = {
        'timestamp': datetime.now().isoformat(),
        'financial_health': fin_health,
        'recommended_monthly_savings': total_allocated,
        'effective_savings_rate': round((total_allocated / income * 100), 1) if income > 0 else 0.0,
        'unallocated_surplus_buffer': round(max(0.0, surplus - total_allocated), 2),
        'evaluated_goals': evaluated_goals,
        'roadmap_12_months': roadmap,
        'suggested_reductions': suggested_reductions,
        'warnings': warnings,
        'actions_next_30_days': actions_next_30_days,
        'methodology_note': 'Deterministic priority-weighted cash-flow waterfall. Calculations respect hard budget constraints without arbitrary assumptions.'
    }
    
    return plan_summary
