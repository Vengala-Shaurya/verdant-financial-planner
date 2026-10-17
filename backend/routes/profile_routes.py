from flask import Blueprint, request, jsonify, g, make_response
from models.db import get_db_connection
from models.seed_data import seed_demo_data
from validators.schemas import validate_profile, validate_register, validate_login
from validators.auth import generate_token, require_auth
from werkzeug.security import check_password_hash, generate_password_hash
import re

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    errors = validate_register(data)
    if errors:
        return jsonify({'errors': errors}), 400

    name = data['name'].strip()
    email = data['email'].strip().lower()
    password = data['password']

    conn = get_db_connection()
    existing = conn.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({'errors': ['An account with this email address already exists. Please sign in.']}), 409

    pw_hash = generate_password_hash(password)
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO users (
        name, email, password_hash, currency, monthly_income, fixed_expenses, 
        variable_expenses, existing_savings, debt_obligations, preferred_savings, 
        debt_in_fixed, is_onboarded, is_demo
    ) VALUES (?, ?, ?, 'INR', 0, 0, 0, 0, 0, 0, 0, 0, 0)
    ''', (name, email, pw_hash))
    user_id = cursor.lastrowid
    conn.commit()

    user_row = conn.execute(
        "SELECT id, name, email, currency, monthly_income, fixed_expenses, variable_expenses, existing_savings, debt_obligations, preferred_savings, debt_in_fixed, is_onboarded, is_demo FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()
    conn.close()

    user_dict = dict(user_row)
    token = generate_token(user_id, email, is_demo=False)

    resp = make_response(jsonify({
        'status': 'success',
        'message': 'Registration successful. Welcome to VERDANT.',
        'token': token,
        'user': user_dict
    }), 201)
    resp.set_cookie('verdant_token', token, httponly=True, samesite='Lax')
    return resp

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    errors = validate_login(data)
    if errors:
        return jsonify({'errors': errors}), 400

    email = data['email'].strip().lower()
    password = data['password']

    conn = get_db_connection()
    user = conn.execute(
        "SELECT id, name, email, password_hash, currency, monthly_income, fixed_expenses, variable_expenses, existing_savings, debt_obligations, preferred_savings, debt_in_fixed, is_onboarded, is_demo FROM users WHERE LOWER(email) = ?",
        (email,)
    ).fetchone()
    conn.close()

    if not user or not user['password_hash']:
        return jsonify({'errors': ['Invalid email or password.']}), 401

    if not check_password_hash(user['password_hash'], password):
        return jsonify({'errors': ['Invalid email or password.']}), 401

    user_dict = dict(user)
    user_dict.pop('password_hash', None)
    token = generate_token(user['id'], user['email'], is_demo=bool(user['is_demo']))

    resp = make_response(jsonify({
        'status': 'success',
        'message': f'Welcome back, {user["name"]}.',
        'token': token,
        'user': user_dict
    }))
    resp.set_cookie('verdant_token', token, httponly=True, samesite='Lax')
    return resp

@auth_bp.route('/demo-login', methods=['POST'])
def demo_login():
    """
    Dedicated 1-click access to the academic demo profile: Arjun Verma.
    Ensures Arjun's profile and seeded sample records exist without affecting personal users.
    """
    demo_user_id = seed_demo_data()
    conn = get_db_connection()
    user = conn.execute(
        "SELECT id, name, email, currency, monthly_income, fixed_expenses, variable_expenses, existing_savings, debt_obligations, preferred_savings, debt_in_fixed, is_onboarded, is_demo FROM users WHERE id = ?",
        (demo_user_id,)
    ).fetchone()
    conn.close()

    user_dict = dict(user)
    token = generate_token(demo_user_id, user_dict['email'], is_demo=True)

    resp = make_response(jsonify({
        'status': 'success',
        'message': 'Loaded academic demonstration profile: Arjun Verma.',
        'token': token,
        'user': user_dict
    }))
    resp.set_cookie('verdant_token', token, httponly=True, samesite='Lax')
    return resp

@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_me():
    """Returns the currently authenticated user session."""
    return jsonify({
        'status': 'success',
        'user': g.current_user
    })

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Clears the authentication session."""
    resp = make_response(jsonify({
        'status': 'success',
        'message': 'Logged out successfully.'
    }))
    resp.delete_cookie('verdant_token')
    return resp

@auth_bp.route('/onboarding', methods=['POST'])
@require_auth
def complete_onboarding():
    """
    First-time financial onboarding setup for newly registered personal accounts.
    Persists baseline monthly financials, creates the initial goal, and marks is_onboarded = 1.
    """
    data = request.get_json() or {}
    user_id = g.current_user['id']

    # Validate monthly figures
    errors = []
    try:
        monthly_income = float(data.get('monthly_income', 0))
        if monthly_income <= 0:
            errors.append("Monthly take-home income must be greater than zero.")
    except (ValueError, TypeError):
        errors.append("Monthly income must be a valid number.")

    try:
        fixed_expenses = float(data.get('fixed_expenses', 0))
        if fixed_expenses < 0:
            errors.append("Fixed monthly expenses cannot be negative.")
    except (ValueError, TypeError):
        errors.append("Fixed expenses must be a valid number.")

    try:
        variable_expenses = float(data.get('variable_expenses', 0))
        if variable_expenses < 0:
            errors.append("Variable monthly expenses cannot be negative.")
    except (ValueError, TypeError):
        errors.append("Variable expenses must be a valid number.")

    try:
        existing_savings = float(data.get('existing_savings', 0))
        if existing_savings < 0:
            errors.append("Existing savings cannot be negative.")
    except (ValueError, TypeError):
        errors.append("Existing savings must be a valid number.")

    try:
        debt_obligations = float(data.get('debt_obligations', 0))
        if debt_obligations < 0:
            errors.append("Debt obligations cannot be negative.")
    except (ValueError, TypeError):
        errors.append("Debt obligations must be a valid number.")

    debt_in_fixed = 1 if data.get('debt_in_fixed', False) else 0
    currency = data.get('currency', 'INR')

    # Initial Goal Validation (Optional or Primary)
    goal_data = data.get('initial_goal')
    if goal_data:
        if not goal_data.get('name'):
            errors.append("Initial goal requires a name.")
        try:
            gtgt = float(goal_data.get('target_amount', 0))
            if gtgt <= 0:
                errors.append("Initial goal target amount must be greater than zero.")
        except (ValueError, TypeError):
            errors.append("Initial goal target amount must be a number.")

    if errors:
        return jsonify({'errors': errors}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Update user profile & onboarded status
    cursor.execute('''
    UPDATE users SET
        monthly_income = ?,
        fixed_expenses = ?,
        variable_expenses = ?,
        existing_savings = ?,
        debt_obligations = ?,
        debt_in_fixed = ?,
        currency = ?,
        is_onboarded = 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    ''', (
        monthly_income,
        fixed_expenses,
        variable_expenses,
        existing_savings,
        debt_obligations,
        debt_in_fixed,
        currency,
        user_id
    ))

    # Create initial goal if provided
    if goal_data and goal_data.get('name') and float(goal_data.get('target_amount', 0)) > 0:
        cursor.execute('''
        INSERT INTO goals (user_id, name, category, target_amount, current_amount, target_date, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            goal_data['name'].strip(),
            goal_data.get('category', 'Emergency Fund'),
            float(goal_data['target_amount']),
            float(goal_data.get('current_amount', 0.0)),
            goal_data.get('target_date', '2026-12-31'),
            goal_data.get('priority', 'High')
        ))

    # Send welcome milestone notification
    cursor.execute('''
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (?, 'milestone', 'Onboarding Complete', 'Your financial baseline and goals have been registered. Your personalised savings plan is ready.')
    ''', (user_id,))

    conn.commit()

    updated_user = conn.execute(
        "SELECT id, name, email, currency, monthly_income, fixed_expenses, variable_expenses, existing_savings, debt_obligations, preferred_savings, debt_in_fixed, is_onboarded, is_demo FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()
    conn.close()

    return jsonify({
        'status': 'success',
        'message': 'Onboarding complete. Your financial profile is configured.',
        'user': dict(updated_user)
    })

@auth_bp.route('/profile', methods=['GET'])
@require_auth
def get_profile():
    return jsonify({'user': g.current_user})

@auth_bp.route('/profile', methods=['PUT'])
@require_auth
def update_profile():
    data = request.get_json() or {}
    user_id = g.current_user['id']

    errors = validate_profile(data)
    if errors:
        return jsonify({'errors': errors}), 400

    debt_in_fixed_val = 1 if data.get('debt_in_fixed') else (0 if 'debt_in_fixed' in data else g.current_user.get('debt_in_fixed', 0))

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
        debt_in_fixed = ?,
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
        debt_in_fixed_val,
        data.get('currency', 'INR'),
        user_id
    ))
    conn.commit()
    user = conn.execute(
        "SELECT id, name, email, currency, monthly_income, fixed_expenses, variable_expenses, existing_savings, debt_obligations, preferred_savings, debt_in_fixed, is_onboarded, is_demo FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()
    conn.close()

    return jsonify({
        'status': 'success',
        'message': 'Financial profile updated successfully.',
        'user': dict(user)
    })
