import os
import jwt
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import request, jsonify, g
from models.db import get_db_connection

JWT_SECRET = os.environ.get('JWT_SECRET', 'verdant-secret-key-pt1-production-safe-token')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 72

def generate_token(user_id: int, email: str, is_demo: bool = False) -> str:
    """Generates a signed JWT token valid for 72 hours."""
    payload = {
        'user_id': user_id,
        'email': email.lower(),
        'is_demo': is_demo,
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    """Decodes and validates a JWT token."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

def require_auth(f):
    """
    Decorator enforcing that requests are authenticated either via:
    1. Authorization: Bearer <token> header, OR
    2. HttpOnly cookie named 'verdant_token'
    Sets g.current_user to the verified user row dict.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        elif 'verdant_token' in request.cookies:
            token = request.cookies.get('verdant_token')

        if not token:
            return jsonify({'error': 'Authentication required. No session token provided.'}), 401

        try:
            payload = decode_token(token)
            user_id = payload.get('user_id')
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Session expired. Please sign in again.'}), 401
        except Exception:
            return jsonify({'error': 'Invalid authentication session.'}), 401

        conn = get_db_connection()
        user = conn.execute(
            "SELECT id, name, email, currency, monthly_income, fixed_expenses, variable_expenses, existing_savings, debt_obligations, preferred_savings, debt_in_fixed, is_onboarded, is_demo FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()
        conn.close()

        if not user:
            return jsonify({'error': 'User account no longer exists.'}), 401

        g.current_user = dict(user)
        return f(*args, **kwargs)
    return decorated_function
