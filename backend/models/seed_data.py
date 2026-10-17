from models.db import get_db_connection
from werkzeug.security import generate_password_hash
from datetime import datetime, date

def seed_demo_data():
    """
    Populates academic demonstration profile:
    - Income: ₹50,000
    - Fixed expenses: ₹15,000
    - Variable expenses: ₹10,000
    - Debt payments: ₹3,000
    - Existing savings: ₹40,000
    - Initial Surplus: ₹22,000
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if demo user exists
    cursor.execute("SELECT id FROM users WHERE email = 'demo@verdant.local'")
    existing = cursor.fetchone()
    
    if existing:
        user_id = existing['id']
        # Reset user data to pristine demo state
        cursor.execute('''
        UPDATE users SET 
            name = 'Arjun Verma',
            monthly_income = 50000.0,
            fixed_expenses = 15000.0,
            variable_expenses = 10000.0,
            existing_savings = 40000.0,
            debt_obligations = 3000.0,
            currency = 'INR',
            preferred_savings = 15000.0
        WHERE id = ?
        ''', (user_id,))
    else:
        cursor.execute('''
        INSERT INTO users (name, email, password_hash, currency, monthly_income, fixed_expenses, variable_expenses, existing_savings, debt_obligations, preferred_savings)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'Arjun Verma',
            'demo@verdant.local',
            generate_password_hash('verdant2026'),
            'INR',
            50000.0,
            15000.0,
            10000.0,
            40000.0,
            3000.0,
            15000.0
        ))
        user_id = cursor.lastrowid

    # Clean existing expenses and goals for clean demo consistency
    cursor.execute("DELETE FROM expenses WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM goals WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM notifications WHERE user_id = ?", (user_id,))

    # Seed realistic, internally consistent expenses
    # Fixed expenses sum ~ 15,000 (Rent: 11000, Broadband/Utilities: 2000, Metro transit: 2000)
    # Variable expenses sum ~ 10,000 (Groceries: 5000, Dining: 2500, Healthcare/Gym: 1500, Streaming: 1000)
    sample_expenses = [
        (11000.0, '2026-10-01', 'Housing', 'Apartment Rent & Maintenance', 'Bank Transfer', 1),
        (2000.0, '2026-10-03', 'Utilities', 'Electricity & High-speed Fiber', 'UPI', 1),
        (2000.0, '2026-10-04', 'Transport', 'Metro Commuter Pass & Fuel', 'Metro Card', 1),
        (5200.0, '2026-10-06', 'Food', 'Monthly Organic Grocery & Provisions', 'Debit Card', 1),
        (2300.0, '2026-10-09', 'Food', 'Weekend Dinners & Artisan Coffee', 'UPI', 0),
        (1500.0, '2026-10-11', 'Healthcare', 'Preventative Checkup & Vitamins', 'UPI', 1),
        (1000.0, '2026-10-12', 'Entertainment', 'Digital Subscriptions & Cinema', 'Credit Card', 0),
        (1500.0, '2026-10-14', 'Shopping', 'Work Attire & Books', 'UPI', 0),
    ]
    for amt, dt, cat, desc, method, ess in sample_expenses:
        cursor.execute('''
        INSERT INTO expenses (user_id, amount, date, category, description, payment_method, is_essential)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, amt, dt, cat, desc, method, ess))

    # Seed goals (Emergency Fund, Higher Education / Tech Certification, Japan Trip)
    sample_goals = [
        ('Emergency Cushion (6 Mo)', 'Emergency Fund', 90000.0, 30000.0, '2027-04-30', 'High'),
        ('Executive AI Certification', 'Education', 45000.0, 10000.0, '2027-02-28', 'High'),
        ('Autumn Travel & Trek', 'Travel', 35000.0, 5000.0, '2027-08-31', 'Medium')
    ]
    for name, cat, tgt, curr, dt, prio in sample_goals:
        cursor.execute('''
        INSERT INTO goals (user_id, name, category, target_amount, current_amount, target_date, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, name, cat, tgt, curr, dt, prio))

    # Seed initial helpful notifications
    sample_notifications = [
        ('milestone', 'Welcome to VERDANT', 'Your initial baseline profile is loaded. Inspect your surplus and generate your first plan.', 0),
        ('budget', 'Healthy Savings Trajectory', 'Your monthly surplus is ₹22,000 (44% rate). Strong capacity for goals.', 0),
        ('deadline', 'Emergency Fund Milestone', 'Emergency cushion is 33% funded. On track to reach target by April 2027.', 0)
    ]
    for ntype, title, msg, is_read in sample_notifications:
        cursor.execute('''
        INSERT INTO notifications (user_id, type, title, message, is_read)
        VALUES (?, ?, ?, ?, ?)
        ''', (user_id, ntype, title, msg, is_read))

    conn.commit()
    conn.close()
    return user_id
