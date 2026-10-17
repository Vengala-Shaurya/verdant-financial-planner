import os
import json
import requests

def get_ai_explanation(plan_summary, user_name="User"):
    """
    Generates rich contextual editorial analysis and commentary using an LLM.
    If no LLM API key (OPENAI_API_KEY or GEMINI_API_KEY) is configured or if the request fails,
    returns a highly tailored, deterministic editorial narrative.
    """
    fin = plan_summary.get('financial_health', {})
    income = fin.get('income', 0)
    surplus = fin.get('monthly_surplus', 0)
    savings_rate = plan_summary.get('effective_savings_rate', 0)
    allocated = plan_summary.get('recommended_monthly_savings', 0)
    goals = plan_summary.get('evaluated_goals', [])
    
    # Check for OpenAI API key
    openai_key = os.environ.get('OPENAI_API_KEY')
    if openai_key:
        try:
            prompt = f"""
            You are an elite, thoughtful private wealth architect for VERDANT, an editorial financial planning system.
            Review this validated financial plan for {user_name}:
            - Monthly Take-Home Income: ₹{income:,.0f}
            - Fixed Needs: ₹{fin.get('fixed_expenses', 0):,.0f}
            - Variable Expenses: ₹{fin.get('variable_expenses', 0):,.0f}
            - Monthly Debt Obligations: ₹{fin.get('debt_obligations', 0):,.0f}
            - Calculated Monthly Net Surplus: ₹{surplus:,.0f}
            - Recommended Savings Allocation: ₹{allocated:,.0f} ({savings_rate}% effective savings rate)
            - Goals Evaluated: {[g['name'] + ' (Allocated: ₹' + str(g['allocated_monthly']) + '/mo, Feasibility: ' + str(g['feasibility']) + ')' for g in goals]}
            
            Provide a 3-paragraph executive financial synthesis:
            Paragraph 1: Assessment of structural cash-flow and capital resilience.
            Paragraph 2: Rationalisation of the goal allocation trade-offs and milestone timing.
            Paragraph 3: Key behavioural rule and risk mitigation strategy for the coming quarter.
            Keep the tone refined, literary, crisp, mathematically grounded, and empowering. Avoid generic advice or emojis.
            """
            headers = {
                "Authorization": f"Bearer {openai_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a senior wealth strategist who writes with intellectual clarity and mathematical precision."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.4
            }
            resp = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                ai_text = data['choices'][0]['message']['content'].strip()
                return {
                    'mode': 'llm_active',
                    'provider': 'OpenAI GPT-4o-mini',
                    'narrative': ai_text
                }
        except Exception as e:
            # Fallback seamlessly
            pass

    # High-quality deterministic editorial analysis fallback
    # Calibrated directly to calculated surplus and health indicators
    if surplus <= 0:
        p1 = f"At a monthly net take-home income of ₹{income:,.0f}, aggregate commitments completely exhaust incoming cash flow, leaving an acute deficit of ₹{abs(surplus):,.0f}. Before capital can be deployed into long-range wealth accumulation, defensive restructuring must take precedence."
        p2 = "Capital allocations to all non-essential goals have been prudently paused. Immediate containment of discretionary variable spending and high-interest debt negotiations represent the only viable path to restoring structural solvency."
        p3 = "Focus exclusively on reclaiming minimum baseline liquidity. Ensure essential shelter, nutrition, and non-negotiable debt minimums are maintained while pausing secondary outflows."
    elif savings_rate >= 30:
        p1 = f"Your current cash structure demonstrates exceptional capital discipline. With a verified monthly surplus of ₹{surplus:,.0f} on ₹{income:,.0f} income, you are capturing a {savings_rate}% savings rate—substantially outperforming conventional 20% savings benchmarks."
        p2 = f"Surplus distribution has been channelled toward your highest-conviction milestones. By allocating ₹{allocated:,.0f} each month, high-priority objectives remain fully on schedule without depriving you of discretionary breathing room."
        p3 = "Protect this advantage through systematic automation. Direct allocations immediately upon salary credit so operational spending never encroaches upon compounding capital reserves."
    elif savings_rate >= 15:
        p1 = f"Your operating cash flow generates a solid monthly surplus of ₹{surplus:,.0f}, yielding a healthy {savings_rate}% savings rate against total take-home income. Your fixed overhead is well within manageable thresholds."
        p2 = f"To balance multiple concurrent objectives, ₹{allocated:,.0f} has been mathematically distributed based on urgency and target timeline. Core emergency resilience is prioritized while steadily accumulating toward target deadlines."
        p3 = "Monitor variable category creep over the coming 60 days. Shaving an additional 5% from secondary leisure expenses will accelerate goal target dates by approximately one to two quarters."
    else:
        p1 = f"Your operating cash balance currently yields a modest surplus of ₹{surplus:,.0f} per month ({savings_rate}% savings rate). While positive, your margin for absorption against unexpected liquidity shocks remains relatively tight."
        p2 = f"Because capital capacity is bounded, ₹{allocated:,.0f} has been concentrated on fundamental safety cushions first, with aspirational goals adjusted to realistic timelines."
        p3 = "Adopt a strict weekly envelope cap for variable expenditures. Even minor friction added to impulse purchases will unlock crucial surplus capacity for your timeline."

    return {
        'mode': 'deterministic_editorial',
        'provider': 'VERDANT Rule-Based Financial Synthesis Engine',
        'narrative': f"{p1}\n\n{p2}\n\n{p3}"
    }
