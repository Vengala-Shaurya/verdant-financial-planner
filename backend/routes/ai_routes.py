from flask import Blueprint, request, jsonify, g
from models.db import get_db_connection
from services.ai_service import (
    generate_plan_ai_insights,
    generate_spending_insights,
    answer_financial_query,
    get_ai_status
)
from validators.auth import require_auth
import json

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/status', methods=['GET'])
def ai_status():
    """Returns whether a live AI provider (Groq or Gemini) is actively connected."""
    return jsonify(get_ai_status())

@ai_bp.route('/plan-insights', methods=['POST'])
@require_auth
def plan_insights():
    """
    AI Feature A: Comprehensive personalized explanations of the active/current savings plan.
    Strictly scoped to g.current_user.
    """
    user = g.current_user
    user_id = user['id']
    data = request.get_json() or {}
    plan_data = data.get('plan')

    conn = get_db_connection()
    # If plan not supplied in body, get latest active plan from DB
    if not plan_data:
        plan_row = conn.execute(
            "SELECT plan_data_json FROM savings_plans WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1",
            (user_id,)
        ).fetchone()
        if plan_row:
            plan_data = json.loads(plan_row['plan_data_json'])
        else:
            conn.close()
            return jsonify({'error': 'No active savings plan found to generate insights for'}), 400

    insights = generate_plan_ai_insights(plan_data, user_name=user['name'])
    conn.close()

    return jsonify({
        'status': 'success',
        'insights': insights
    })

@ai_bp.route('/spending-insights', methods=['POST', 'GET'])
@require_auth
def spending_insights():
    """
    AI Feature B: Personalized spending audit, category velocity, and outlier analysis.
    Strictly scoped to g.current_user.
    """
    user = g.current_user
    user_id = user['id']

    conn = get_db_connection()
    expenses = conn.execute("SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC", (user_id,)).fetchall()
    conn.close()

    insights = generate_spending_insights(
        [dict(e) for e in expenses],
        income=float(user['monthly_income']),
        fixed_exp=float(user['fixed_expenses']),
        var_exp=float(user['variable_expenses'])
    )

    return jsonify({
        'status': 'success',
        'spending_insights': insights
    })

@ai_bp.route('/ask', methods=['POST'])
@require_auth
def ask_verdant():
    """
    AI Feature C: Contextual conversational financial assistant and hypothetical scenario simulator.
    Strictly scoped to g.current_user.
    """
    user = g.current_user
    user_id = user['id']
    data = request.get_json() or {}
    query = data.get('query', '').strip()

    if not query:
        return jsonify({'error': 'Query string cannot be empty'}), 400

    conn = get_db_connection()
    goals = conn.execute("SELECT * FROM goals WHERE user_id = ? AND is_completed = 0", (user_id,)).fetchall()
    plan_row = conn.execute("SELECT plan_data_json FROM savings_plans WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1", (user_id,)).fetchone()
    active_plan = json.loads(plan_row['plan_data_json']) if plan_row else None

    # Fetch recent conversation history strictly for this user
    history_rows = conn.execute(
        "SELECT role, content FROM ai_conversations WHERE user_id = ? ORDER BY id ASC LIMIT 10",
        (user_id,)
    ).fetchall()
    conv_history = [dict(h) for h in history_rows]

    # Process query
    result = answer_financial_query(
        dict(user),
        [dict(g) for g in goals],
        active_plan,
        query,
        conversation_history=conv_history
    )

    # Persist conversation turn
    conn.execute("INSERT INTO ai_conversations (user_id, role, content) VALUES (?, 'user', ?)", (user_id, query))
    scenario_json = json.dumps(result.get('scenario_simulation')) if result.get('scenario_simulation') else None
    conn.execute("INSERT INTO ai_conversations (user_id, role, content, scenario_data_json) VALUES (?, 'assistant', ?, ?)", (user_id, result.get('answer', ''), scenario_json))
    conn.commit()
    conn.close()

    return jsonify({
        'status': 'success',
        'response': result
    })

@ai_bp.route('/history', methods=['GET'])
@require_auth
def get_ai_history():
    """
    Returns recent Ask VERDANT chat history strictly for the authenticated user.
    """
    user_id = g.current_user['id']
    conn = get_db_connection()
    rows = conn.execute(
        "SELECT id, role, content, scenario_data_json, created_at FROM ai_conversations WHERE user_id = ? ORDER BY id ASC LIMIT 30",
        (user_id,)
    ).fetchall()
    conn.close()

    history = []
    for r in rows:
        d = dict(r)
        if d.get('scenario_data_json'):
            try:
                d['scenario_simulation'] = json.loads(d['scenario_data_json'])
            except Exception:
                pass
        history.append(d)

    return jsonify({'history': history})
