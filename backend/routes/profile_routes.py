from flask import Blueprint, request, jsonify
from models.db import get_db_connection
from models.seed_data import seed_demo_data
from validators.schemas import validate_profile
from werkzeug.security import check_password_hash, generate_password_hash

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/demo-login', methods=['POST'])
def demo_login():
    """Provides instant 1-click access to the seeded academic demo profile."""
    user_id = seed_demo_data()
    conn = get_db_connection()
    user = conn.execute("SELECT id, name, email, currency, monthly_income, fixed_expenses, variable_expenses, existing_savings, debt_obligations, preferred_savings FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return jsonify({
        'status': 'success',
        'message': 'Demo account loaded with calibrated profile data.',
        'user': dict(user)
    })

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    user_id = request.args.get('user_id', 1, type=int)
    conn = get_db_connection()
    user = conn.execute("SELECT id, name, email, currency, monthly_income, fixed_expenses, variable_expenses, existing_savings, debt_obligations, preferred_savings FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': dict(user)})

@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    data = request.get_json() or {}
    user_id = data.get('user_id', 1)
    
    errors = validate_profile(data)
    if errors:
        return jsonify({'errors': errors}), 400
        
    conn = get_db_connection()
    conn.execute('''
    UPDATE users SET
        name = COALESCE(?, name),
        monthly_income = COALESCE(?, monthly_income),
        fixed_expenses = COALESCE(?, fixed_expenses),
        variable_expenses = COALESCE(?, variable_expenses),
        existing_savings = COALESCE(?, existing_savings),
        debt_obligations = COALESCE(?, debt_obligations),
        preferred_savings = COALESCE(?, preferred_savings),
        currency = COALESCE(?, currency),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    ''', (
        data.get('name'),
        data.get('monthly_income'),
        data.get('fixed_expenses'),
        data.get('variable_expenses'),
        data.get('existing_savings'),
        data.get('debt_obligations'),
        data.get('preferred_savings'),
        data.get('currency', 'INR'),
        user_id
    ))
    conn.commit()
    user = conn.execute("SELECT id, name, email, currency, monthly_income, fixed_expenses, variable_expenses, existing_savings, debt_obligations, preferred_savings FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    
    return jsonify({
        'status': 'success',
        'message': 'Financial profile updated successfully.',
        'user': dict(user)
    })
