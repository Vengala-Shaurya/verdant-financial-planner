import os
import json
import logging
import re
from typing import Dict, Any, List, Optional
from services.analysis_engine import calculate_financial_health, calculate_goal_allocations

logger = logging.getLogger("verdant.ai")

# Google GenAI SDK Import
try:
    from google import genai
    from google.genai import types
    GEMINI_SDK_AVAILABLE = True
except ImportError:
    GEMINI_SDK_AVAILABLE = False
    logger.warning("google-genai SDK not installed or unavailable.")

def is_gemini_enabled() -> bool:
    """Checks if GEMINI_ENABLED is true (default is true if key is present)."""
    val = os.environ.get("GEMINI_ENABLED", "true").strip().lower()
    return val in ("true", "1", "yes")

def get_gemini_model_name() -> str:
    """
    Returns the configured Gemini model identifier.
    Default: 'gemini-2.5-flash' (Google's latest official high-speed, cost-effective multimodal model with generous free-tier limits).
    Fallback options: 'gemini-1.5-flash', 'gemini-1.5-pro'.
    """
    return os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip()

def get_gemini_client() -> Optional[Any]:
    """
    Instantiates and returns the official Google GenAI client if GEMINI_API_KEY is configured.
    Never logs or exposes the key.
    """
    if not GEMINI_SDK_AVAILABLE or not is_gemini_enabled():
        return None

    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    try:
        # Initializing client using official google.genai Client
        client = genai.Client(api_key=api_key)
        return client
    except Exception as e:
        logger.warning(f"Failed to initialize Google GenAI client: {e}")
        return None

def clean_json_text(text: str) -> str:
    """Strips markdown code fences like ```json ... ``` from model responses."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()

# Backward compatibility alias
def get_ai_explanation(plan_summary: Dict[str, Any], user_name: str = "User") -> Dict[str, Any]:
    return generate_plan_ai_insights(plan_summary, user_name)

# ==============================================================================
# AI FEATURE A: Personalised Savings-Plan Explanation
# ==============================================================================

def generate_plan_ai_insights(plan_summary: Dict[str, Any], user_name: str = "User") -> Dict[str, Any]:
    """
    Feature A: Generates structured narrative explanations for the verified savings plan.
    Strictly grounded in deterministic figures; Gemini explains but cannot alter numerical allocations.
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

    client = get_gemini_client()
    if client:
        try:
            model_name = get_gemini_model_name()
            system_instruction = (
                "You are an elite, mathematically rigorous wealth architect for VERDANT, an editorial financial planning system. "
                "You provide clear, encouraging, and actionable commentary grounded STRICTLY in the provided calculations. "
                "Never contradict the verified surplus, expenses, or allocation numbers. "
                "Never invent financial figures. Return valid JSON matching the requested schema."
            )

            goals_summary_txt = [
                f"{g['name']}: Gap ₹{g.get('remaining_gap', 0):,.0f}, Allocated ₹{g.get('allocated_monthly', 0):,.0f}/mo, Feasibility: {g.get('feasibility', 'Evaluated')}"
                for g in goals
            ]

            prompt = f"""
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
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.3
            )
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config
            )

            if response and response.text:
                parsed = json.loads(clean_json_text(response.text))
                if "personalized_summary" in parsed and "allocation_rationales" in parsed:
                    return {
                        'mode': 'llm_active',
                        'provider': f"Google Gemini ({model_name})",
                        'narrative': parsed.get('personalized_summary', ''),
                        'allocation_rationales': parsed.get('allocation_rationales', []),
                        'spending_observations': parsed.get('spending_observations', []),
                        'discretionary_reductions': parsed.get('discretionary_reductions', []),
                        'risks_and_tradeoffs': parsed.get('risks_and_tradeoffs', []),
                        'action_plan_30_days': parsed.get('action_plan_30_days', actions)
                    }
        except Exception as e:
            logger.warning(f"Gemini Feature A call failed: {e}. Falling back to deterministic engine.")

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
        'provider': 'VERDANT Rule-Based Financial Synthesis Engine (AI Offline)',
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

    client = get_gemini_client()
    if client and has_sufficient_history:
        try:
            model_name = get_gemini_model_name()
            system_instruction = (
                "You are an expert personal financial auditor for VERDANT. "
                "Analyze the provided actual expense records. Do NOT invent transactions or trends. "
                "Return a JSON object with structured spending insights."
            )
            prompt = f"""
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
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.3
            )
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config
            )
            if response and response.text:
                parsed = json.loads(clean_json_text(response.text))
                return {
                    'mode': 'llm_active',
                    'provider': f"Google Gemini ({model_name})",
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
            logger.warning(f"Gemini Feature B call failed: {e}. Falling back to deterministic insights.")

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
        obs.append(f"Ledger currently has {len(expenses)} transaction(s). Log 5 or more transactions across diverse dates to enable automated trend analysis.")

    assessment = (
        f"Total verified ledger outflows stand at ₹{total_spent:,.0f} across {len(expenses)} transaction(s). "
        f"{'Spending is concentrated in essential living costs.' if top_categories and top_categories[0]['category'] in ['Housing', 'Food', 'Utilities'] else 'Discretionary outflows represent a significant portion of current velocity.'}"
    )

    return {
        'mode': 'deterministic_editorial',
        'provider': 'VERDANT Rule-Based Spending Auditor (AI Offline)',
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

def classify_query_intent(query_text: str) -> str:
    """Classifies user queries into: greeting, casual_short, hypothetical, financial, general."""
    q = (query_text or '').strip().lower()
    
    # Common greetings and small talk
    greetings = {"hi", "hello", "hey", "hola", "greetings", "good morning", "good evening", "good afternoon", "namaste"}
    if q in greetings or re.match(r"^(?:hi|hello|hey|greetings|namaste)\b", q):
        return "greeting"

    # Casual slang / single-word queries
    casual_words = {"bruh", "bro", "sup", "yo", "cool", "ok", "okay", "thanks", "thank you", "nice", "bye"}
    if q in casual_words or re.match(r"^(?:bruh|bro|yo|sup)\b[!., ]*", q):
        return "casual"

    # Hypothetical what-if queries
    if any(k in q for k in ["what if", "suppose", "if my income", "if income", "if rent", "if expenses", "decreases by", "increases by", "falls by", "rises by"]):
        return "hypothetical"

    # Financial domain queries
    fin_keywords = ["surplus", "savings", "save", "plan", "goal", "budget", "emergency", "fund", "debt", "emi", "expense", "spend", "income", "money", "invest", "runway", "cash flow", "waterfall", "priority", "allocate"]
    if any(k in q for k in fin_keywords):
        return "financial"

    return "general"

def answer_financial_query(user_profile: Dict[str, Any], goals: List[Dict[str, Any]], active_plan: Optional[Dict[str, Any]], query: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
    """
    Feature C: Contextual conversational assistant capable of handling greetings,
    answering user-specific financial questions, simulating hypothetical 'what-if' scenarios,
    and handling non-financial questions appropriately.
    """
    query_trimmed = query.strip()
    query_lower = query_trimmed.lower()
    intent = classify_query_intent(query_lower)

    user_name = user_profile.get('name', 'there')
    income = float(user_profile.get('monthly_income', 0) or 0)
    fixed_exp = float(user_profile.get('fixed_expenses', 0) or 0)
    var_exp = float(user_profile.get('variable_expenses', 0) or 0)
    debt = float(user_profile.get('debt_obligations', 0) or 0)
    savings = float(user_profile.get('existing_savings', 0) or 0)
    current_surplus = income - fixed_exp - var_exp - debt

    # 1. Parse and simulate hypothetical 'what-if' scenarios deterministically in Python
    scenario_result = None
    if intent == "hypothetical":
        delta_income = 0.0
        delta_expenses = 0.0

        inc_decrease_match = re.search(r'income (?:falls|drops|decreases|reduced|down) by (?:₹|rs\.?|inr)?\s*([0-9,]+)', query_lower)
        inc_increase_match = re.search(r'income (?:rises|increases|grows|up) by (?:₹|rs\.?|inr)?\s*([0-9,]+)', query_lower)
        rent_increase_match = re.search(r'(?:rent|expenses?|outflows?) (?:increases?|rises?|goes up) by (?:₹|rs\.?|inr)?\s*([0-9,]+)', query_lower)
        rent_decrease_match = re.search(r'(?:rent|expenses?|outflows?) (?:decreases?|falls?|goes down) by (?:₹|rs\.?|inr)?\s*([0-9,]+)', query_lower)

        if inc_decrease_match:
            delta_income = -float(inc_decrease_match.group(1).replace(',', ''))
        elif inc_increase_match:
            delta_income = float(inc_increase_match.group(1).replace(',', ''))

        if rent_increase_match:
            delta_expenses = float(rent_increase_match.group(1).replace(',', ''))
        elif rent_decrease_match:
            delta_expenses = -float(rent_decrease_match.group(1).replace(',', ''))

        if delta_income != 0.0 or delta_expenses != 0.0:
            hypo_income = max(0.0, income + delta_income)
            hypo_fixed = max(0.0, fixed_exp + delta_expenses)
            hypo_health = calculate_financial_health(hypo_income, hypo_fixed, var_exp, debt, savings)
            hypo_goals, hypo_allocated, hypo_warnings = calculate_goal_allocations(hypo_health['monthly_surplus'], goals)
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

    # 2. Try Gemini LLM Generation
    client = get_gemini_client()
    if client:
        try:
            model_name = get_gemini_model_name()
            system_instruction = (
                f"You are Ask VERDANT, an intelligent conversational financial planning assistant for {user_name}. "
                "Tone: Editorial, intellectual, warm, concise, and mathematically rigorous. "
                "\nCRITICAL DIRECTIVES:\n"
                "1. If the user sends a greeting (e.g. 'hi', 'hello', 'hey'), respond with a natural, friendly greeting and briefly invite them to explore their ledger or test a financial scenario. Do NOT dump long financial statistics in response to simple greetings.\n"
                "2. If the user asks a casual query (e.g. 'bruh', 'sup', 'ok'), give a witty, natural, context-aware reply acknowledging them while gently reminding them of what you can assist with.\n"
                "3. If the user asks about their finances, use ONLY their verified ledger data provided in the context. Never invent income or expenses.\n"
                "4. If answering a hypothetical scenario, explain the calculated simulation clearly and remind the user that it does not alter their real saved ledger.\n"
                "5. If financial information is incomplete (e.g. income is 0 or unrecorded), state what is missing instead of guessing.\n"
                "6. Format currency consistently as ₹ with commas (e.g. ₹22,000). Use Markdown formatting cleanly."
            )

            user_context_block = f"""
AUTHENTICATED USER CONTEXT ({user_name}):
- Verified Take-Home Income: ₹{income:,.0f}
- Verified Fixed Living Expenses: ₹{fixed_exp:,.0f}
- Verified Variable Expenses: ₹{var_exp:,.0f}
- Verified Debt Obligations: ₹{debt:,.0f}
- Verified Monthly Net Surplus: ₹{current_surplus:,.0f}
- Liquid Emergency Savings: ₹{savings:,.0f}
- Active Goals: {[{'name': g.get('name'), 'target': f"₹{float(g.get('target_amount',0)):,.0f}", 'saved': f"₹{float(g.get('current_amount',0)):,.0f}", 'priority': g.get('priority')} for g in goals]}
"""
            if scenario_result:
                user_context_block += f"\nHYPOTHETICAL SIMULATION RESULT (Calculated by Python Engine):\n{json.dumps(scenario_result)}"

            # Prepare prompt contents with recent history
            contents = []
            contents.append(user_context_block)
            if conversation_history:
                for h in conversation_history[-4:]:
                    role_label = "User" if h.get('role') == 'user' else "Assistant"
                    contents.append(f"{role_label}: {h.get('content', '')}")
            contents.append(f"User Question: {query_trimmed}")

            full_prompt = "\n\n".join(contents)
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3
            )
            response = client.models.generate_content(
                model=model_name,
                contents=full_prompt,
                config=config
            )

            if response and response.text:
                return {
                    'mode': 'llm_active',
                    'provider': f"Google Gemini ({model_name})",
                    'answer': response.text.strip(),
                    'scenario_simulation': scenario_result
                }
        except Exception as e:
            logger.warning(f"Gemini Feature C call failed: {e}. Falling back to contextual fallback.")

    # 3. Contextual Fallback Generator (Handles Greetings, Slang, What-Ifs, and Financial queries naturally)
    answer_text = generate_contextual_query_answer(
        intent, query_lower, user_name, income, fixed_exp, var_exp, debt, savings, current_surplus, goals, active_plan, scenario_result
    )

    return {
        'mode': 'deterministic_editorial',
        'provider': 'VERDANT Rule-Based Financial Assistant (AI Offline)',
        'answer': answer_text,
        'scenario_simulation': scenario_result
    }

def generate_contextual_query_answer(
    intent: str, query: str, user_name: str, income: float, fixed: float, var: float, debt: float, savings: float, current_surplus: float, goals: List[Dict[str, Any]], active_plan: Optional[Dict[str, Any]], scenario_result: Optional[Dict[str, Any]]
) -> str:
    """Generates context-aware responses when the live LLM is offline or unconfigured."""

    # 1. Greetings
    if intent == "greeting":
        return (
            f"Hello {user_name}! I am **Ask VERDANT**, your private financial planning assistant.\n\n"
            f"Your ledger is currently showing a verified monthly surplus of **₹{current_surplus:,.0f}**. "
            f"You can ask me questions about your savings plan, explore your goal priorities, or test what-if scenarios (e.g., *'What happens if my income falls by ₹5,000?'*)."
        )

    # 2. Casual / Slang
    if intent == "casual":
        return (
            f"I hear you! I'm here and ready to help you optimize your personal wealth architecture. "
            f"Feel free to ask a question about your ₹{current_surplus:,.0f} surplus, your goals, or test any financial change."
        )

    # 3. Hypothetical simulation
    if scenario_result:
        shift_str = f"+₹{scenario_result['surplus_shift']:,.0f}" if scenario_result['surplus_shift'] >= 0 else f"-₹{abs(scenario_result['surplus_shift']):,.0f}"
        return (
            f"**Hypothetical Simulation Analysis:**\n\n"
            f"If this adjustment occurs, your monthly net surplus would shift by **{shift_str}**, resulting in a revised surplus of **₹{scenario_result['hypothetical_surplus']:,.0f}/month**.\n\n"
            f"Under this simulated cash flow, the deterministic allocation engine would recommend total monthly savings of **₹{scenario_result['hypothetical_allocated_savings']:,.0f}**.\n\n"
            f"*Note: This is an exploratory simulation for strategic planning only. Your persistent profile values remain unchanged.*"
        )

    # 4. Incomplete financial data
    if income <= 0:
        return (
            f"Your financial baseline currently has no recorded take-home income. "
            f"To provide accurate financial projections, please update your profile with your monthly income and fixed commitments in the Financial Profile tab."
        )

    # 5. Targeted financial inquiries
    if 'why' in query and 'plan' in query:
        return (
            f"Your current plan was generated using VERDANT's priority-weighted waterfall algorithm. "
            f"With verified income of ₹{income:,.0f} and total commitments of ₹{(fixed + var + debt):,.0f}, your net monthly surplus is **₹{current_surplus:,.0f}**. "
            f"The engine prioritized goals with near deadlines and high necessity (such as Emergency Cushion) to ensure core liquidity before funding secondary milestones."
        )
    elif 'emergency' in query:
        runway = round(savings / ((fixed + var) or 1), 1)
        return (
            f"Your liquid savings stand at **₹{savings:,.0f}**, providing approximately **{runway} months** of essential living runway (based on ₹{(fixed + var):,.0f}/mo living costs). "
            f"To accelerate emergency funding, allocating discretionary trims from variable spending directly builds this safety barrier."
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
            f"You have {len(goals)} active goal(s) registered. "
            f"Feel free to ask specific questions about your goals or test hypothetical scenarios like *'What if my rent increases by ₹2,000?'*."
        )
