from flask import Blueprint, request, jsonify, g
from models.db import get_db_connection
from validators.schemas import validate_goal
from validators.auth import require_auth
from datetime import datetime, date

goal_bp = Blueprint('goals', __name__)

@goal_bp.route('/', methods=['GET'])
@require_auth
def get_goals():
    user_id = g.current_user['id']
    conn = get_db_connection()
    goals = conn.execute("SELECT * FROM goals WHERE user_id = ? ORDER BY is_completed ASC, priority DESC, id ASC", (user_id,)).fetchall()
    
    today = date.today()
    enriched = []
    total_target = 0.0
    total_saved = 0.0
    
    for g_row in goals:
        d = dict(g_row)
        tgt = float(d['target_amount'])
        curr = float(d['current_amount'])
        gap = max(0.0, tgt - curr)
        pct = round((curr / tgt * 100), 1) if tgt > 0 else 100.0
        
        months_left = 1
        if d.get('target_date'):
            try:
                t_date = datetime.strptime(d['target_date'], '%Y-%m-%d').date()
                months_left = max(1, int((t_date - today).days / 30.4))
            except Exception:
                months_left = 6
                
        req_monthly = round(gap / months_left, 2)
        
        d['remaining_gap'] = gap
        d['completion_pct'] = min(100.0, pct)
        d['months_remaining'] = months_left
        d['required_monthly'] = req_monthly
        
        total_target += tgt
        total_saved += curr
        enriched.append(d)
        
    conn.close()
    
    return jsonify({
        'goals': enriched,
        'summary': {
            'total_target': round(total_target, 2),
            'total_saved': round(total_saved, 2),
            'overall_progress_pct': round((total_saved / total_target * 100), 1) if total_target > 0 else 0.0,
            'active_goals_count': len([g_item for g_item in enriched if not g_item['is_completed']])
        }
    })

@goal_bp.route('/', methods=['POST'])
@require_auth
def add_goal():
    data = request.get_json() or {}
    errors = validate_goal(data)
    if errors:
        return jsonify({'errors': errors}), 400
        
    user_id = g.current_user['id']
    name = data['name']
    category = data.get('category', 'Custom')
    target_amount = float(data['target_amount'])
    current_amount = float(data.get('current_amount', 0.0))
    target_date = data['target_date']
    priority = data.get('priority', 'Medium')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO goals (user_id, name, category, target_amount, current_amount, target_date, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, name, category, target_amount, current_amount, target_date, priority))
    new_id = cursor.lastrowid
    
    cursor.execute('''
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (?, 'milestone', 'New Financial Goal Established', ?)
    ''', (user_id, f"Goal '{name}' created with a target of ₹{target_amount:,.0f}."))
    
    conn.commit()
    new_goal = conn.execute("SELECT * FROM goals WHERE id = ?", (new_id,)).fetchone()
    conn.close()
    
    return jsonify({
        'status': 'success',
        'message': 'Goal created successfully.',
        'goal': dict(new_goal)
    }), 201

@goal_bp.route('/<int:goal_id>', methods=['PUT'])
@require_auth
def update_goal(goal_id):
    user_id = g.current_user['id']
    data = request.get_json() or {}
    errors = validate_goal(data)
    if errors:
        return jsonify({'errors': errors}), 400
        
    conn = get_db_connection()
    existing = conn.execute("SELECT id FROM goals WHERE id = ? AND user_id = ?", (goal_id, user_id)).fetchone()
    if not existing:
        conn.close()
        return jsonify({'error': 'Goal not found or access denied'}), 404

    conn.execute('''
    UPDATE goals SET
        name = ?,
        category = ?,
        target_amount = ?,
        current_amount = ?,
        target_date = ?,
        priority = ?,
        is_completed = ?
    WHERE id = ? AND user_id = ?
    ''', (
        data['name'],
        data.get('category', 'Custom'),
        float(data['target_amount']),
        float(data.get('current_amount', 0.0)),
        data['target_date'],
        data.get('priority', 'Medium'),
        1 if data.get('is_completed') else 0,
        goal_id,
        user_id
    ))
    conn.commit()
    updated = conn.execute("SELECT * FROM goals WHERE id = ?", (goal_id,)).fetchone()
    conn.close()
    
    return jsonify({
        'status': 'success',
        'message': 'Goal parameters updated.',
        'goal': dict(updated)
    })

@goal_bp.route('/<int:goal_id>/contribute', methods=['POST'])
@require_auth
def contribute_to_goal(goal_id):
    user_id = g.current_user['id']
    data = request.get_json() or {}
    amount = float(data.get('amount', 0))
    if amount <= 0:
        return jsonify({'error': 'Contribution amount must be greater than zero'}), 400
        
    conn = get_db_connection()
    goal = conn.execute("SELECT * FROM goals WHERE id = ? AND user_id = ?", (goal_id, user_id)).fetchone()
    if not goal:
        conn.close()
        return jsonify({'error': 'Goal not found or access denied'}), 404
        
    new_amt = float(goal['current_amount']) + amount
    tgt = float(goal['target_amount'])
    is_completed = 1 if new_amt >= tgt else 0
    
    conn.execute('''
    UPDATE goals SET current_amount = ?, is_completed = ? WHERE id = ? AND user_id = ?
    ''', (new_amt, is_completed, goal_id, user_id))
    
    if is_completed:
        conn.execute('''
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, 'milestone', 'Goal Completed!', ?)
        ''', (user_id, f"Congratulations! You fully funded '{goal['name']}' with ₹{new_amt:,.0f}."))
    else:
        conn.execute('''
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, 'milestone', 'Contribution Logged', ?)
        ''', (user_id, f"Added ₹{amount:,.0f} to '{goal['name']}'. Balance is now ₹{new_amt:,.0f}."))
        
    conn.commit()
    updated = conn.execute("SELECT * FROM goals WHERE id = ?", (goal_id,)).fetchone()
    conn.close()
    
    return jsonify({
        'status': 'success',
        'message': f'Successfully recorded ₹{amount:,.0f} contribution.',
        'goal': dict(updated)
    })

@goal_bp.route('/<int:goal_id>', methods=['DELETE'])
@require_auth
def delete_goal(goal_id):
    user_id = g.current_user['id']
    conn = get_db_connection()
    existing = conn.execute("SELECT id FROM goals WHERE id = ? AND user_id = ?", (goal_id, user_id)).fetchone()
    if not existing:
        conn.close()
        return jsonify({'error': 'Goal not found or access denied'}), 404

    conn.execute("DELETE FROM goals WHERE id = ? AND user_id = ?", (goal_id, user_id))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success', 'message': 'Goal removed.'})
