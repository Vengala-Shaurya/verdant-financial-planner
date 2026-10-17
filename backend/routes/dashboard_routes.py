from flask import Blueprint, request, jsonify
from models.db import get_db_connection
from services.analysis_engine import calculate_financial_health

dash_bp = Blueprint('dashboard', __name__)

@dash_bp.route('/overview', methods=['GET'])
def get_dashboard_overview():
    user_id = request.args.get('user_id', 1, type=int)
    conn = get_db_connection()
    
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
        
    income = float(user['monthly_income'])
    fixed_exp = float(user['fixed_expenses'])
    var_exp = float(user['variable_expenses'])
    debt = float(user['debt_obligations'])
    savings = float(user['existing_savings'])
    
    fin_health = calculate_financial_health(income, fixed_exp, var_exp, debt, savings)
    
    # Recent expenses
    recent_expenses = conn.execute("SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, id DESC LIMIT 5", (user_id,)).fetchall()
    
    # Category spending breakdown
    cat_breakdown = conn.execute('''
        SELECT category, SUM(amount) as total 
        FROM expenses 
        WHERE user_id = ? 
        GROUP BY category 
        ORDER BY total DESC
    ''', (user_id,)).fetchall()
    
    # Goals status
    goals = conn.execute("SELECT * FROM goals WHERE user_id = ? ORDER BY is_completed ASC, priority DESC", (user_id,)).fetchall()
    
    total_goal_target = sum(float(g['target_amount']) for g in goals)
    total_goal_saved = sum(float(g['current_amount']) for g in goals)
    
    # Active plan
    active_plan = conn.execute("SELECT * FROM savings_plans WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1", (user_id,)).fetchone()
    
    # Unread notifications count
    unread_notifs = conn.execute("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0", (user_id,)).fetchone()['count']
    
    conn.close()
    
    return jsonify({
        'user': dict(user),
        'financial_health': fin_health,
        'recent_expenses': [dict(e) for e in recent_expenses],
        'category_breakdown': [dict(c) for c in cat_breakdown],
        'goals_summary': {
            'total_target': round(total_goal_target, 2),
            'total_saved': round(total_goal_saved, 2),
            'completion_pct': round((total_goal_saved / total_goal_target * 100), 1) if total_goal_target > 0 else 0.0,
            'active_count': len([g for g in goals if not g['is_completed']])
        },
        'has_active_plan': active_plan is not None,
        'unread_notifications_count': unread_notifs
    })

@dash_bp.route('/notifications', methods=['GET'])
def get_notifications():
    user_id = request.args.get('user_id', 1, type=int)
    conn = get_db_connection()
    notifs = conn.execute("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 25", (user_id,)).fetchall()
    conn.close()
    return jsonify({'notifications': [dict(n) for n in notifs]})

@dash_bp.route('/notifications/<int:nid>/read', methods=['PUT'])
def mark_notification_read(nid):
    conn = get_db_connection()
    conn.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (nid,))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

@dash_bp.route('/notifications/read-all', methods=['PUT'])
def mark_all_notifications_read():
    user_id = request.args.get('user_id', 1, type=int)
    conn = get_db_connection()
    conn.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})
