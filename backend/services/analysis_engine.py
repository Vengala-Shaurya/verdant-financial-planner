from datetime import datetime, date
import json

CATEGORIES_ESSENTIALITY = {
    'housing': True,
    'utilities': True,
    'healthcare': True,
    'debt payments': True,
    'education': True,
    'food': True,
    'transport': True,
    'entertainment': False,
    'shopping': False,
    'other': False
}

def calculate_financial_health(income, fixed_expenses, variable_expenses, debt_obligations, existing_savings, actual_saved_period=0.0):
    """
    Core mathematical engine for personal financial indicators.
    Accounting Model:
    - Monthly Net Surplus = Monthly Income - Fixed Expenses - Variable Expenses - Debt Obligations.
    - Debt is counted exactly once.
    - Rates:
      * potential_surplus_rate = surplus / income * 100
      * recommended_savings_rate = recommended_savings / income * 100
      * actual_savings_rate = actual_saved_period / income * 100
    - Emergency Runway:
      * Standard Essential Outflows = fixed_expenses + variable_expenses
      * Total Outflows (including debt) = total_expenses + debt_obligations
      * runway_essential_months = existing_savings / total_expenses
      * runway_total_months = existing_savings / (total_expenses + debt_obligations)
    """
    income = max(0.0, float(income or 0))
    fixed_expenses = max(0.0, float(fixed_expenses or 0))
    variable_expenses = max(0.0, float(variable_expenses or 0))
    debt_obligations = max(0.0, float(debt_obligations or 0))
    existing_savings = max(0.0, float(existing_savings or 0))
    actual_saved_period = max(0.0, float(actual_saved_period or 0))

    total_expenses = fixed_expenses + variable_expenses
    surplus = income - total_expenses - debt_obligations

    # Savings rates handling zero income safely
    potential_surplus_rate = round((surplus / income * 100), 1) if income > 0 and surplus > 0 else 0.0
    actual_savings_rate = round((actual_saved_period / income * 100), 1) if income > 0 else 0.0

    # Emergency runway definitions
    runway_essential_months = round(existing_savings / total_expenses, 2) if total_expenses > 0 else (99.0 if existing_savings > 0 else 0.0)
    total_commitments = total_expenses + debt_obligations
    runway_total_months = round(existing_savings / total_commitments, 2) if total_commitments > 0 else (99.0 if existing_savings > 0 else 0.0)

    # 50/30/20 benchmark guideline
    benchmark_needs = round(income * 0.50, 2)
    benchmark_wants = round(income * 0.30, 2)
    benchmark_savings = round(income * 0.20, 2)

    return {
        'income': round(income, 2),
        'fixed_expenses': round(fixed_expenses, 2),
        'variable_expenses': round(variable_expenses, 2),
        'total_expenses': round(total_expenses, 2),
        'debt_obligations': round(debt_obligations, 2),
        'total_monthly_commitments': round(total_commitments, 2),
        'monthly_surplus': round(surplus, 2),
        'potential_surplus_rate': potential_surplus_rate,
        'actual_savings_rate': actual_savings_rate,
        # Default displayed runway covers essential fixed + variable expenses (1.6 Mo for demo ₹40k/₹25k)
        'emergency_runway_months': round(runway_essential_months, 1),
        'emergency_runway_detailed': {
            'essential_only_months': runway_essential_months,
            'including_debt_months': runway_total_months,
            'explanation': f"Runway of {round(runway_essential_months, 1)} months covers essential fixed & variable living expenses (₹{total_expenses:,.0f}/mo). When factoring monthly debt commitments of ₹{debt_obligations:,.0f}, comprehensive runway is {round(runway_total_months, 1)} months."
        },
        'benchmarks': {
            'needs_50': benchmark_needs,
            'wants_30': benchmark_wants,
            'savings_20': benchmark_savings,
            'notes': '50/30/20 is an advisory guideline: 50% Essential Needs, 30% Discretionary, 20% Compounding Wealth.'
        }
    }

def calculate_goal_allocations(surplus, goals):
    """
    Deterministic priority-weighted goal allocation waterfall.
    Invariant: Sum of monthly allocations <= max(0, surplus).
    Score_i = PriorityWeight_i * (10 / (MonthsRemaining_i + 1))
    Where:
    - High Priority = 3x (Emergency Funds receive +2 extra priority, so 5x total)
    - Medium Priority = 2x
    - Low Priority = 1x
    - Completed or zero-gap goals are skipped.
    """
    today = date.today()
    evaluated_goals = []
    total_needed_monthly = 0.0

    for g in goals:
        target_amt = float(g.get('target_amount', 0) or 0)
        curr_amt = float(g.get('current_amount', 0) or 0)
        gap = max(0.0, target_amt - curr_amt)
        target_date_str = g.get('target_date', '')

        # Calculate remaining months with boundary safety
        months_left = 1
        if target_date_str:
            try:
                t_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
                days_diff = (t_date - today).days
                if days_diff <= 0:
                    months_left = 1  # Overdue or due this month
                else:
                    months_left = max(1, int(days_diff / 30.4 + 0.5))
            except Exception:
                months_left = 6

        ideal_monthly_req = gap / months_left if months_left > 0 else gap
        if gap > 0:
            total_needed_monthly += ideal_monthly_req

        priority_str = str(g.get('priority', 'Medium')).capitalize()
        priority_weight = 3 if priority_str == 'High' else (2 if priority_str == 'Medium' else 1)

        # Emergency fund priority elevation (+2)
        name_lower = str(g.get('name', '')).lower()
        cat_lower = str(g.get('category', '')).lower()
        if 'emergency' in name_lower or 'emergency' in cat_lower:
            priority_weight += 2

        is_completed = bool(g.get('is_completed', False)) or (gap <= 0.01)

        evaluated_goals.append({
            'id': g.get('id'),
            'name': g.get('name', 'Goal'),
            'category': g.get('category', 'Custom'),
            'target_amount': round(target_amt, 2),
            'current_amount': round(curr_amt, 2),
            'remaining_gap': round(gap, 2),
            'target_date': target_date_str,
            'months_remaining': months_left,
            'ideal_monthly_req': round(ideal_monthly_req, 2),
            'priority': priority_str,
            'priority_weight': priority_weight,
            'allocated_monthly': 0.0,
            'projected_months_to_complete': None,
            'is_completed': is_completed,
            'feasibility': 'Completed' if is_completed else 'Feasible'
        })

    active_goals = [eg for eg in evaluated_goals if not eg['is_completed'] and eg['remaining_gap'] > 0]

    if surplus <= 0:
        for eg in active_goals:
            eg['allocated_monthly'] = 0.0
            eg['feasibility'] = 'Unfeasible (Zero or Negative Surplus)'
            eg['projected_months_to_complete'] = None
        warning_msg = "Monthly surplus is zero or negative. No savings can be allocated from unavailable funds. Immediate expense reduction or debt restructuring required."
        return evaluated_goals, 0.0, [warning_msg]

    warnings = []
    if surplus >= total_needed_monthly:
        for eg in active_goals:
            eg['allocated_monthly'] = round(eg['ideal_monthly_req'], 2)
            eg['projected_months_to_complete'] = eg['months_remaining']
            eg['feasibility'] = 'On Track (Fully Funded)'
        total_allocated = round(total_needed_monthly, 2)
    else:
        warnings.append(
            f"Available surplus (₹{surplus:,.0f}) is less than ideal total requirement (₹{total_needed_monthly:,.0f}). Prioritising high-impact goals."
        )
        # Weighted proportional distribution based on score
        # Score = priority_weight * (10 / (months_remaining + 1))
        total_score = sum(eg['priority_weight'] * (10.0 / (eg['months_remaining'] + 1)) for eg in active_goals)

        remaining_pool = surplus
        for eg in active_goals:
            score = eg['priority_weight'] * (10.0 / (eg['months_remaining'] + 1))
            ratio = score / total_score if total_score > 0 else 1.0 / len(active_goals)
            suggested = round(surplus * ratio, 2)
            # Cap at ideal monthly requirement so we don't overfund one goal while starving another
            alloc = min(suggested, eg['ideal_monthly_req'])
            eg['allocated_monthly'] = alloc
            remaining_pool -= alloc

        # Distribute any remaining fractional pool due to rounding/capping
        if remaining_pool > 0.01:
            sorted_by_prio = sorted(active_goals, key=lambda x: -x['priority_weight'])
            for eg in sorted_by_prio:
                if remaining_pool <= 0:
                    break
                gap_to_ideal = eg['ideal_monthly_req'] - eg['allocated_monthly']
                if gap_to_ideal > 0:
                    add_alloc = min(remaining_pool, gap_to_ideal)
                    eg['allocated_monthly'] = round(eg['allocated_monthly'] + add_alloc, 2)
                    remaining_pool -= add_alloc

        # Set projected completion times
        for eg in active_goals:
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

        total_allocated = round(sum(eg['allocated_monthly'] for eg in active_goals), 2)

    # Invariant: total_allocated must NEVER exceed max(0, surplus)
    total_allocated = min(total_allocated, max(0.0, surplus))

    return evaluated_goals, total_allocated, warnings

def build_month_by_month_roadmap(evaluated_goals, months_horizon=12):
    """
    12-month forward cumulative simulation across all active goals.
    Conservative zero-return baseline (no fabricated market interest rate).
    """
    roadmap = []
    current_balances = {eg['id']: eg['current_amount'] for eg in evaluated_goals}

    current_month_names = [f"Month {i+1}" for i in range(months_horizon)]

    for m in range(months_horizon):
        month_label = current_month_names[m]
        month_savings = 0.0
        goal_snapshots = []

        for eg in evaluated_goals:
            gid = eg['id']
            target = eg['target_amount']
            alloc = eg.get('allocated_monthly', 0.0)

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

def generate_savings_plan_data(user, expenses, goals, actual_saved_period=0.0):
    """
    Orchestrates financial analysis, deterministic allocation, roadmap generation,
    and returns a structured plan object with actionable advice.
    """
    income = float(user.get('monthly_income', 0) or 0)
    fixed_exp = float(user.get('fixed_expenses', 0) or 0)
    var_exp = float(user.get('variable_expenses', 0) or 0)
    debt = float(user.get('debt_obligations', 0) or 0)
    savings = float(user.get('existing_savings', 0) or 0)

    fin_health = calculate_financial_health(income, fixed_exp, var_exp, debt, savings, actual_saved_period)
    surplus = fin_health['monthly_surplus']

    evaluated_goals, total_allocated, warnings = calculate_goal_allocations(surplus, goals)
    roadmap = build_month_by_month_roadmap(evaluated_goals, months_horizon=12)

    # Analyze actual expenses to identify discretionary leakages
    expense_category_totals = {}
    for exp in expenses:
        cat = str(exp.get('category', 'other')).lower()
        expense_category_totals[cat] = expense_category_totals.get(cat, 0.0) + float(exp.get('amount', 0))

    suggested_reductions = []
    for cat in ['entertainment', 'shopping', 'food', 'other']:
        if cat in expense_category_totals and expense_category_totals[cat] > 0.15 * income and income > 0:
            potential_saving = round(expense_category_totals[cat] * 0.15, 0)
            suggested_reductions.append({
                'category': cat.capitalize(),
                'current_spent': round(expense_category_totals[cat], 2),
                'suggested_trim': potential_saving,
                'rationale': f"Discretionary spending in {cat.capitalize()} accounts for >15% of monthly income. Trimming 15% recovers ₹{potential_saving:,.0f} for goals."
            })

    if not suggested_reductions and var_exp > 0.25 * income and income > 0:
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

    recommended_savings_rate = round((total_allocated / income * 100), 1) if income > 0 else 0.0

    plan_summary = {
        'timestamp': datetime.now().isoformat(),
        'financial_health': fin_health,
        'recommended_monthly_savings': total_allocated,
        'recommended_savings_rate': recommended_savings_rate,
        'effective_savings_rate': recommended_savings_rate, # backward compatibility
        'unallocated_surplus_buffer': round(max(0.0, surplus - total_allocated), 2),
        'evaluated_goals': evaluated_goals,
        'roadmap_12_months': roadmap,
        'suggested_reductions': suggested_reductions,
        'warnings': warnings,
        'actions_next_30_days': actions_next_30_days,
        'methodology_note': 'Deterministic priority-weighted cash-flow waterfall. Calculations respect hard budget constraints without arbitrary assumptions.'
    }

    return plan_summary
