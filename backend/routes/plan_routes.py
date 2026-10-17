from flask import Blueprint, request, jsonify
from models.db import get_db_connection
from services.analysis_engine import generate_savings_plan_data
from services.ai_service import get_ai_explanation
import json

plan_bp = Blueprint('plans', __name__)

@plan_bp.route('/generate', methods=['POST'])
def generate_plan():
    data = request.get_json() or {}
    user_id = data.get('user_id', 1)
    
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
        
    expenses = conn.execute("SELECT * FROM expenses WHERE user_id = ?", (user_id,)).fetchall()
    goals = conn.execute("SELECT * FROM goals WHERE user_id = ? AND is_completed = 0", (user_id,)).fetchall()
    
    # 1. Deterministic Financial Computation
    plan_data = generate_savings_plan_data(dict(user), [dict(e) for e in expenses], [dict(g) for g in goals])
    
    # 2. AI Contextual Synthesis
    ai_synthesis = get_ai_explanation(plan_data, user_name=user['name'])
    plan_data['ai_synthesis'] = ai_synthesis
    
    # Check for previous active plan to calculate diff
    previous_plan_row = conn.execute(
        "SELECT id, plan_data_json, created_at FROM savings_plans WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1",
        (user_id,)
    ).fetchone()
    
    plan_comparison = None
    if previous_plan_row:
        try:
            prev_data = json.loads(previous_plan_row['plan_data_json'])
            prev_surplus = prev_data.get('financial_health', {}).get('monthly_surplus', 0)
            prev_savings = prev_data.get('recommended_monthly_savings', 0)
            curr_surplus = plan_data['financial_health']['monthly_surplus']
            curr_savings = plan_data['recommended_monthly_savings']
            
            surplus_diff = curr_surplus - prev_surplus
            savings_diff = curr_savings - prev_savings
            
            plan_comparison = {
                'previous_plan_date': previous_plan_row['created_at'],
                'previous_surplus': prev_surplus,
                'current_surplus': curr_surplus,
                'surplus_diff': surplus_diff,
                'previous_recommended_savings': prev_savings,
                'current_recommended_savings': curr_savings,
                'savings_diff': savings_diff,
                'summary_text': f"Monthly surplus changed by {'+' if surplus_diff >= 0 else ''}₹{surplus_diff:,.0f} compared to the previous plan. Recommended savings adjusted by {'+' if savings_diff >= 0 else ''}₹{savings_diff:,.0f}."
            }
        except Exception:
            pass
            
    plan_data['plan_comparison'] = plan_comparison
    conn.close()
    
    return jsonify({
        'status': 'success',
        'message': 'Personalised savings roadmap generated successfully.',
        'plan': plan_data
    })

@plan_bp.route('/save', methods=['POST'])
def save_plan():
    data = request.get_json() or {}
    user_id = data.get('user_id', 1)
    plan_data = data.get('plan')
    
    if not plan_data:
        return jsonify({'error': 'Plan data is required to save'}), 400
        
    conn = get_db_connection()
    # Mark old plans as non-active
    conn.execute("UPDATE savings_plans SET is_active = 0 WHERE user_id = ?", (user_id,))
    
    fin = plan_data.get('financial_health', {})
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO savings_plans (user_id, monthly_income, total_expenses, debt_obligations, monthly_surplus, recommended_savings, savings_rate, plan_data_json, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    ''', (
        user_id,
        fin.get('income', 0),
        fin.get('total_expenses', 0),
        fin.get('debt_obligations', 0),
        fin.get('monthly_surplus', 0),
        plan_data.get('recommended_monthly_savings', 0),
        plan_data.get('effective_savings_rate', 0),
        json.dumps(plan_data)
    ))
    plan_id = cursor.lastrowid
    
    conn.execute('''
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (?, 'milestone', 'Savings Plan Activated', ?)
    ''', (user_id, f"Plan saved: Recommended monthly savings set to ₹{plan_data.get('recommended_monthly_savings', 0):,.0f}."))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'status': 'success',
        'message': 'Personalised plan committed to persistent ledger.',
        'plan_id': plan_id
    })

@plan_bp.route('/active', methods=['GET'])
def get_active_plan():
    user_id = request.args.get('user_id', 1, type=int)
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM savings_plans WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1", (user_id,)).fetchone()
    
    all_revisions = conn.execute(
        "SELECT id, monthly_surplus, recommended_savings, savings_rate, created_at, is_active FROM savings_plans WHERE user_id = ? ORDER BY id DESC",
        (user_id,)
    ).fetchall()
    
    conn.close()
    
    if not row:
        return jsonify({'plan': None, 'revisions': [dict(r) for r in all_revisions]})
        
    plan_data = json.loads(row['plan_data_json'])
    plan_data['db_id'] = row['id']
    plan_data['created_at'] = row['created_at']
    
    return jsonify({
        'plan': plan_data,
        'revisions': [dict(r) for r in all_revisions]
    })
