from flask import Blueprint, request, jsonify
from models.db import get_db_connection
from validators.schemas import validate_expense

expense_bp = Blueprint('expenses', __name__)

@expense_bp.route('/', methods=['GET'])
def get_expenses():
    user_id = request.args.get('user_id', 1, type=int)
    category = request.args.get('category')
    search = request.args.get('search')
    
    query = "SELECT * FROM expenses WHERE user_id = ?"
    params = [user_id]
    
    if category and category.lower() != 'all':
        query += " AND LOWER(category) = ?"
        params.append(category.lower())
        
    if search:
        query += " AND (description LIKE ? OR category LIKE ? OR payment_method LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])
        
    query += " ORDER BY date DESC, id DESC"
    
    conn = get_db_connection()
    rows = conn.execute(query, params).fetchall()
    
    # Calculate category summary
    cat_summary = conn.execute('''
        SELECT category, SUM(amount) as total, COUNT(*) as count 
        FROM expenses 
        WHERE user_id = ? 
        GROUP BY category 
        ORDER BY total DESC
    ''', (user_id,)).fetchall()
    
    total_spent = conn.execute('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?', (user_id,)).fetchone()['total'] or 0.0
    
    conn.close()
    
    return jsonify({
        'expenses': [dict(r) for r in rows],
        'category_breakdown': [dict(c) for c in cat_summary],
        'total_spent': round(total_spent, 2)
    })

@expense_bp.route('/', methods=['POST'])
def add_expense():
    data = request.get_json() or {}
    errors = validate_expense(data)
    if errors:
        return jsonify({'errors': errors}), 400
        
    user_id = data.get('user_id', 1)
    amount = float(data['amount'])
    date_val = data['date']
    category = data['category']
    description = data.get('description', '')
    payment_method = data.get('payment_method', 'UPI')
    is_essential = 1 if data.get('is_essential', True) else 0
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO expenses (user_id, amount, date, category, description, payment_method, is_essential)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, amount, date_val, category, description, payment_method, is_essential))
    new_id = cursor.lastrowid
    
    # Log notification if expense is unusually large (> 5000)
    if amount >= 5000:
        cursor.execute('''
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, 'budget', 'Significant Outflow Recorded', ?)
        ''', (user_id, f"A single expenditure of ₹{amount:,.0f} in {category} was logged."))
        
    conn.commit()
    new_exp = conn.execute("SELECT * FROM expenses WHERE id = ?", (new_id,)).fetchone()
    conn.close()
    
    return jsonify({
        'status': 'success',
        'message': 'Expense entry added to ledger.',
        'expense': dict(new_exp)
    }), 201

@expense_bp.route('/<int:expense_id>', methods=['PUT'])
def update_expense(expense_id):
    data = request.get_json() or {}
    errors = validate_expense(data)
    if errors:
        return jsonify({'errors': errors}), 400
        
    conn = get_db_connection()
    conn.execute('''
    UPDATE expenses SET
        amount = ?,
        date = ?,
        category = ?,
        description = ?,
        payment_method = ?,
        is_essential = ?
    WHERE id = ?
    ''', (
        data['amount'],
        data['date'],
        data['category'],
        data.get('description', ''),
        data.get('payment_method', 'UPI'),
        1 if data.get('is_essential', True) else 0,
        expense_id
    ))
    conn.commit()
    updated = conn.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,)).fetchone()
    conn.close()
    
    if not updated:
        return jsonify({'error': 'Expense not found'}), 404
        
    return jsonify({
        'status': 'success',
        'message': 'Expense updated.',
        'expense': dict(updated)
    })

@expense_bp.route('/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success', 'message': 'Expense removed from ledger.'})
