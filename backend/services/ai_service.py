import os
import json
import logging
from typing import Dict, Any, List, Optional
from services.analysis_engine import calculate_financial_health, calculate_goal_allocations

logger = logging.getLogger("verdant.ai")

# Check for OpenAI SDK
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

def get_openai_client() -> Optional[Any]:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key or not OPENAI_AVAILABLE:
        return None
    try:
        return OpenAI(api_key=api_key, timeout=12.0)
    except Exception as e:
        logger.warning(f"Failed to initialize OpenAI client: {e}")
        return None

def get_model_name() -> str:
    return os.environ.get("OPENAI_MODEL", "gpt-4o-mini").strip()

# Backward compatibility alias
def get_ai_explanation(plan_summary: Dict[str, Any], user_name: str = "User") -> Dict[str, Any]:
    return generate_plan_ai_insights(plan_summary, user_name)

# ==============================================================================
# AI FEATURE A: Personalised Savings-Plan Explanation
# ==============================================================================

def generate_plan_ai_insights(plan_summary: Dict[str, Any], user_name: str = "User") -> Dict[str, Any]:
    """
    Feature A: Generates structured, validated narrative explanation for the verified savings plan.
    Strictly grounded in deterministic figures; LLM cannot alter numerical allocations.
    """
    fin = plan_summary.get('financial_health', {})
    income = fin.get('income', 0)
    surplus = fin.get('monthly_surplus', 0)
    allocated = plan_summary.get('recommended_monthly_savings', 0)
    savings_rate = plan_summary.get('recommended_savings_rate', 0)
    goals = plan_summary.get('evaluated_goals', [])
    reductions = plan_summary.get('suggested_reductions', [])
    warnings = plan_summary.get('warnings', [])
    actions = plan_summary.get('actions_next_30_days', [])

    client = get_openai_client()
    if client:
        try:
            system_prompt = (
                "You are an elite, mathematically rigorous wealth architect for VERDANT, an editorial financial planning system. "
                "You provide intellectual, clear, and actionable commentary grounded STRICTLY in the provided calculations. "
                "Never contradict the verified surplus or allocation numbers. Return a valid JSON object matching the requested schema."
            )

            goals_summary_txt = [
                f"{g['name']}: Gap ₹{g['remaining_gap']:,.0f}, Allocated ₹{g['allocated_monthly']:,.0f}/mo, Feasibility: {g['feasibility']}"
                for g in goals
            ]

            user_prompt = f"""
Analyze this verified financial plan for {user_name}:
- Take-Home Monthly Income: ₹{income:,.0f}
- Fixed Essential Living Expenses: ₹{fin.get('fixed_expenses', 0):,.0f}
- Variable Living Outflows: ₹{fin.get('variable_expenses', 0):,.0f}
- Debt Obligations: ₹{fin.get('debt_obligations', 0):,.0f}
- Net Monthly Surplus: ₹{surplus:,.0f}
- Recommended Monthly Savings Allocation: ₹{allocated:,.0f} ({savings_rate}% effective savings rate)
- Unallocated Buffer: ₹{plan_summary.get('unallocated_surplus_buffer', 0):,.0f}
- Evaluated Goals: {goals_summary_txt}
- System Warnings: {warnings}

Produce a JSON response with exactly these keys:
{{
  "personalized_summary": "1-2 paragraphs assessing structural cash-flow and capital discipline",
  "allocation_rationales": ["Why priority weighting and deadlines shaped this allocation"],
  "spending_observations": ["Key observation on expense patterns"],
  "discretionary_reductions": ["Specific trim recommendation"],
  "risks_and_tradeoffs": ["Milestone delays or liquidity friction risks"],
  "action_plan_30_days": ["Concrete action 1", "Concrete action 2", "Concrete action 3"]
}}
"""
            response = client.chat.completions.create(
                model=get_model_name(),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )

            raw_content = response.choices[0].message.content
            parsed = json.loads(raw_content)

            # Validate schema
            if "personalized_summary" in parsed and "allocation_rationales" in parsed:
                return {
                    'mode': 'llm_active',
                    'provider': f"OpenAI ({get_model_name()})",
                    'narrative': parsed.get('personalized_summary', ''),
                    'allocation_rationales': parsed.get('allocation_rationales', []),
                    'spending_observations': parsed.get('spending_observations', []),
                    'discretionary_reductions': parsed.get('discretionary_reductions', []),
                    'risks_and_tradeoffs': parsed.get('risks_and_tradeoffs', []),
                    'action_plan_30_days': parsed.get('action_plan_30_days', actions)
                }
        except Exception as e:
            logger.warning(f"OpenAI Feature A call failed or malformed: {e}. Falling back to deterministic engine.")

    # High-fidelity deterministic fallback
    return get_deterministic_plan_insights(plan_summary, user_name)

def get_deterministic_plan_insights(plan_summary: Dict[str, Any], user_name: str) -> Dict[str, Any]:
    fin = plan_summary.get('financial_health', {})
    income = fin.get('income', 0)
    surplus = fin.get('monthly_surplus', 0)
    allocated = plan_summary.get('recommended_monthly_savings', 0)
    savings_rate = plan_summary.get('recommended_savings_rate', 0)
    reductions = plan_summary.get('suggested_reductions', [])
    warnings = plan_summary.get('warnings', [])
    actions = plan_summary.get('actions_next_30_days', [])

    if surplus <= 0:
        summary = (
            f"At a monthly take-home income of ₹{income:,.0f}, verified commitments completely exhaust incoming cash flow, "
            f"leaving a net deficit of ₹{abs(surplus):,.0f}. Before capital can be deployed into forward wealth goals, defensive restructuring is required."
        )
        rationales = [
            "All savings goal contributions are paused because funding them from non-existent surplus would incur unmanageable debt.",
            "Immediate containment of variable spending is the only mathematical avenue to regain positive cash flow."
        ]
        tradeoffs = ["Goals are deferred until positive baseline liquidity is restored."]
    elif savings_rate >= 30:
        summary = (
            f"Your current cash architecture demonstrates strong capital discipline. With a verified monthly surplus of ₹{surplus:,.0f} "
            f"on ₹{income:,.0f} income, you capture a {savings_rate}% savings rate—well above standard wealth accumulation benchmarks."
        )
        rationales = [
            f"Allocating ₹{allocated:,.0f} monthly directly channels surplus into high-conviction goals while leaving ₹{plan_summary.get('unallocated_surplus_buffer', 0):,.0f} as an unallocated cushion for cash-flow variance.",
            "Emergency cushion milestones receive mathematical priority weighting to insulate your portfolio from sudden shocks."
        ]
        tradeoffs = ["Aggressive funding allows parallel goal advancement without sacrificing lifestyle essentials."]
    else:
        summary = (
            f"Your operating cash balance yields a verified monthly surplus of ₹{surplus:,.0f} ({savings_rate}% savings rate). "
            f"Your fixed overhead is manageable, but discretionary outflows require intentional tracking to protect timeline commitments."
        )
        rationales = [
            f"Allocating ₹{allocated:,.0f}/month concentrates resources on urgent deadlines first.",
            "Secondary goals receive scaled contributions to respect the hard surplus constraint."
        ]
        tradeoffs = ["Longer horizons on secondary milestones to guarantee primary emergency cushion completion."]

    spending_obs = [
        f"Essential fixed needs account for ₹{fin.get('fixed_expenses', 0):,.0f} ({round(fin.get('fixed_expenses', 0)/(income or 1)*100)}% of income)."
    ]
    if reductions:
        spending_obs.append(f"Discretionary category trims could free up an additional ₹{sum(r['suggested_trim'] for r in reductions):,.0f}/mo.")

    return {
        'mode': 'deterministic_editorial',
        'provider': 'VERDANT Rule-Based Financial Synthesis Engine',
        'narrative': summary,
        'allocation_rationales': rationales,
        'spending_observations': spending_obs,
        'discretionary_reductions': [r['rationale'] for r in reductions] if reductions else ["Variable spending is within benchmark guidelines."],
        'risks_and_tradeoffs': tradeoffs if tradeoffs else warnings,
        'action_plan_30_days': actions
    }

# ==============================================================================
# AI FEATURE B: Personalised Spending Insights
# ==============================================================================

def generate_spending_insights(expenses: List[Dict[str, Any]], income: float, fixed_exp: float, var_exp: float) -> Dict[str, Any]:
    """
    Feature B: Analyzes ledger transactions, category totals, high-value outliers,
    and returns ranked observations with concrete actions.
    """
    income = max(0.0, float(income or 0))
    total_spent = sum(float(e.get('amount', 0)) for e in expenses)

    # Category totals
    cat_totals = {}
    for e in expenses:
        cat = str(e.get('category', 'Other')).capitalize()
        cat_totals[cat] = cat_totals.get(cat, 0.0) + float(e.get('amount', 0))

    sorted_cats = sorted(cat_totals.items(), key=lambda x: -x[1])
    top_categories = [{'category': c, 'amount': round(a, 2), 'pct_of_spend': round(a / (total_spent or 1) * 100, 1)} for c, a in sorted_cats]

    # Large expenses threshold: > ₹3,000 or > 10% of income
    large_expense_threshold = max(3000.0, 0.10 * income) if income > 0 else 3000.0
    large_expenses = [
        {'id': e.get('id'), 'description': e.get('description'), 'amount': float(e.get('amount', 0)), 'category': e.get('category'), 'date': e.get('date')}
        for e in expenses if float(e.get('amount', 0)) >= large_expense_threshold
    ]

    has_sufficient_history = len(expenses) >= 5

    client = get_openai_client()
    if client and has_sufficient_history:
        try:
            system_prompt = (
                "You are an expert personal financial auditor for VERDANT. "
                "Analyze the provided actual expense records. Do NOT invent transactions or trends. "
                "Return a JSON object with structured spending insights."
            )
            user_prompt = f"""
Take-Home Income: ₹{income:,.0f}
Total Logged Spend: ₹{total_spent:,.0f}
Top Categories: {top_categories[:4]}
Large Outflows (>= ₹{large_expense_threshold:,.0f}): {large_expenses[:5]}
Total Recorded Transactions: {len(expenses)}

Return JSON:
{{
  "spending_assessment": "Crisp 1-2 sentence overall spending efficiency verdict",
  "key_observations": ["Observation 1 with exact numbers", "Observation 2"],
  "actionable_trims": ["Actionable recommendation 1", "Actionable recommendation 2"]
}}
"""
            response = client.chat.completions.create(
                model=get_model_name(),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            parsed = json.loads(response.choices[0].message.content)
            return {
                'mode': 'llm_active',
                'provider': f"OpenAI ({get_model_name()})",
                'has_sufficient_history': True,
                'total_spent': round(total_spent, 2),
                'top_categories': top_categories[:5],
                'large_expenses': large_expenses,
                'large_expense_threshold': large_expense_threshold,
                'spending_assessment': parsed.get('spending_assessment', ''),
                'key_observations': parsed.get('key_observations', []),
                'actionable_trims': parsed.get('actionable_trims', [])
            }
        except Exception as e:
            logger.warning(f"OpenAI Feature B call failed: {e}. Falling back to deterministic insights.")

    # Deterministic spending insights
    obs = []
    trims = []
    if top_categories:
        top_cat = top_categories[0]
        obs.append(f"Top expenditure category is {top_cat['category']} totaling ₹{top_cat['amount']:,.0f} ({top_cat['pct_of_spend']}% of total recorded spending).")

    if large_expenses:
        obs.append(f"{len(large_expenses)} transaction(s) exceeded the significant outflow threshold of ₹{large_expense_threshold:,.0f}.")
        trims.append(f"Review large single outflows such as '{large_expenses[0]['description']}' (₹{large_expenses[0]['amount']:,.0f}) to ensure they are planned.")

    if not has_sufficient_history:
        obs.append("Ledger has limited transaction history. Log 5 or more transactions across diverse dates to enable deep trend analysis.")

    assessment = (
        f"Total verified ledger outflows stand at ₹{total_spent:,.0f} across {len(expenses)} transactions. "
        f"{'Spending is concentrated in essential living costs.' if top_categories and top_categories[0]['category'] in ['Housing', 'Food', 'Utilities'] else 'Discretionary outflows represent a significant portion of current velocity.'}"
    )

    return {
        'mode': 'deterministic_editorial',
        'provider': 'VERDANT Rule-Based Spending Auditor',
        'has_sufficient_history': has_sufficient_history,
        'total_spent': round(total_spent, 2),
        'top_categories': top_categories[:5],
        'large_expenses': large_expenses,
        'large_expense_threshold': large_expense_threshold,
        'spending_assessment': assessment,
        'key_observations': obs,
        'actionable_trims': trims if trims else ["Maintain daily ledger logging to prevent unnoticed variable leakage."]
    }

# ==============================================================================
# AI FEATURE C: Contextual "Ask VERDANT" Assistant & Hypothetical Simulation
# ==============================================================================

def answer_financial_query(user_profile: Dict[str, Any], goals: List[Dict[str, Any]], active_plan: Optional[Dict[str, Any]], query: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
    """
    Feature C: Contextual conversational assistant capable of answering questions
    and parsing & computing hypothetical 'what-if' scenarios through Python calculation.
    """
    query_lower = query.lower()
    income = float(user_profile.get('monthly_income', 0) or 0)
    fixed_exp = float(user_profile.get('fixed_expenses', 0) or 0)
    var_exp = float(user_profile.get('variable_expenses', 0) or 0)
    debt = float(user_profile.get('debt_obligations', 0) or 0)
    savings = float(user_profile.get('existing_savings', 0) or 0)

    # 1. Detect if this is a hypothetical 'what-if' question
    scenario_result = None
    is_hypothetical = False
    delta_income = 0.0
    delta_expenses = 0.0

    # Pattern check: income change
    import re
    inc_decrease_match = re.search(r'income (?:falls|drops|decreases|reduced) by (?:₹|rs\.?|inr)?\s*([0-9,]+)', query_lower)
    inc_increase_match = re.search(r'income (?:rises|increases|grows) by (?:₹|rs\.?|inr)?\s*([0-9,]+)', query_lower)
    rent_increase_match = re.search(r'(?:rent|expenses?) (?:increases?|rises?|goes up) by (?:₹|rs\.?|inr)?\s*([0-9,]+)', query_lower)

    if inc_decrease_match:
        val = float(inc_decrease_match.group(1).replace(',', ''))
        delta_income = -val
        is_hypothetical = True
    elif inc_increase_match:
        val = float(inc_increase_match.group(1).replace(',', ''))
        delta_income = val
        is_hypothetical = True

    if rent_increase_match:
        val = float(rent_increase_match.group(1).replace(',', ''))
        delta_expenses = val
        is_hypothetical = True

    if is_hypothetical:
        hypo_income = max(0.0, income + delta_income)
        hypo_fixed = max(0.0, fixed_exp + delta_expenses)
        hypo_health = calculate_financial_health(hypo_income, hypo_fixed, var_exp, debt, savings)
        hypo_goals, hypo_allocated, hypo_warnings = calculate_goal_allocations(hypo_health['monthly_surplus'], goals)

        current_surplus = income - fixed_exp - var_exp - debt
        surplus_shift = hypo_health['monthly_surplus'] - current_surplus

        scenario_result = {
            'is_hypothetical': True,
            'hypothetical_income': hypo_income,
            'hypothetical_fixed_expenses': hypo_fixed,
            'hypothetical_surplus': hypo_health['monthly_surplus'],
            'surplus_shift': surplus_shift,
            'hypothetical_allocated_savings': hypo_allocated,
            'hypothetical_savings_rate': hypo_health['potential_surplus_rate'],
            'affected_goals': [
                {'name': g['name'], 'allocated': g['allocated_monthly'], 'feasibility': g['feasibility']}
                for g in hypo_goals
            ]
        }

    client = get_openai_client()
    if client:
        try:
            system_prompt = (
                "You are VERDANT's AI Financial Architect. Answer the user's inquiry based exclusively on their verified records. "
                "If a hypothetical scenario is analyzed, explain the mathematically calculated consequences clearly. "
                "Always remind the user that hypothetical scenarios are simulations and do NOT alter their real financial baseline."
            )

            context_msg = f"""
USER CONTEXT:
- Real Take-Home Income: ₹{income:,.0f}
- Real Fixed Expenses: ₹{fixed_exp:,.0f}
- Real Variable Expenses: ₹{var_exp:,.0f}
- Real Debt Obligations: ₹{debt:,.0f}
- Real Net Surplus: ₹{(income - fixed_exp - var_exp - debt):,.0f}
- Existing Liquid Savings: ₹{savings:,.0f}
- Current Goals: {[{'name': g.get('name'), 'target': g.get('target_amount'), 'gap': float(g.get('target_amount',0)) - float(g.get('current_amount',0))} for g in goals]}
"""
            if scenario_result:
                context_msg += f"\nHYPOTHETICAL SIMULATION RESULT (Calculated by Python Engine):\n{json.dumps(scenario_result)}"

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "system", "content": context_msg}
            ]

            if conversation_history:
                for h in conversation_history[-4:]:
                    messages.append({"role": h.get('role', 'user'), "content": h.get('content', '')})

            messages.append({"role": "user", "content": query})

            response = client.chat.completions.create(
                model=get_model_name(),
                messages=messages,
                temperature=0.3
            )
            answer_text = response.choices[0].message.content.strip()

            return {
                'mode': 'llm_active',
                'provider': f"OpenAI ({get_model_name()})",
                'answer': answer_text,
                'scenario_simulation': scenario_result
            }
        except Exception as e:
            logger.warning(f"OpenAI Feature C call failed: {e}. Falling back to deterministic response.")

    # High-quality deterministic response generator
    answer_text = generate_deterministic_query_answer(query_lower, income, fixed_exp, var_exp, debt, savings, goals, active_plan, scenario_result)

    return {
        'mode': 'deterministic_editorial',
        'provider': 'VERDANT Rule-Based Financial Assistant',
        'answer': answer_text,
        'scenario_simulation': scenario_result
    }

def generate_deterministic_query_answer(query: str, income: float, fixed: float, var: float, debt: float, savings: float, goals: List[Dict[str, Any]], active_plan: Optional[Dict[str, Any]], scenario_result: Optional[Dict[str, Any]]) -> str:
    current_surplus = income - fixed - var - debt

    if scenario_result:
        shift_str = f"+₹{scenario_result['surplus_shift']:,.0f}" if scenario_result['surplus_shift'] >= 0 else f"-₹{abs(scenario_result['surplus_shift']):,.0f}"
        return (
            f"**Hypothetical Simulation Analysis:**\n\n"
            f"If this adjustment occurs, your monthly net surplus would shift by **{shift_str}**, resulting in a revised surplus of **₹{scenario_result['hypothetical_surplus']:,.0f}/month**.\n\n"
            f"Under this simulated cash flow, the deterministic allocation engine would recommend total monthly savings of **₹{scenario_result['hypothetical_allocated_savings']:,.0f}**.\n\n"
            f"*Note: This is an exploratory simulation for strategic planning only. Your persistent profile values remain unchanged.*"
        )

    if 'why' in query and 'plan' in query:
        return (
            f"Your current plan was generated using VERDANT's priority-weighted waterfall algorithm. "
            f"With verified income of ₹{income:,.0f} and total commitments of ₹{(fixed + var + debt):,.0f}, your net monthly surplus is ₹{current_surplus:,.0f}. "
            f"The engine prioritized goals with near deadlines and high necessity (such as Emergency Cushion) to ensure core liquidity before funding secondary milestones."
        )
    elif 'emergency' in query:
        return (
            f"Your liquid savings stand at ₹{savings:,.0f}, providing approximately {round(savings / (fixed + var or 1), 1)} months of essential living runway (₹{(fixed + var):,.0f}/mo). "
            f"To accelerate completion, trimming 10% of variable spending unlocks additional capital for immediate allocation."
        )
    elif 'priorit' in query:
        return (
            "VERDANT assigns 5x effective priority to Emergency Funds, 3x to High Priority goals, 2x to Medium, and 1x to Low, inversely scaled by remaining months. "
            "Safety cushions are always prioritized over aspirational purchases to insulate against solvency shocks."
        )
    else:
        return (
            f"Based on your verified financial profile, your available monthly surplus is **₹{current_surplus:,.0f}** "
            f"({round(current_surplus / (income or 1) * 100, 1)}% of ₹{income:,.0f} income). "
            f"You have {len(goals)} active goals with total funding demand. You can explore 'what-if' questions (e.g. 'What happens if income falls by ₹5,000?') to simulate timeline impacts."
        )
