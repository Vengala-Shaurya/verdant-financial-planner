import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'verdant.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table with is_onboarded & is_demo flags
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        currency TEXT DEFAULT 'INR',
        monthly_income REAL DEFAULT 0.0,
        fixed_expenses REAL DEFAULT 0.0,
        variable_expenses REAL DEFAULT 0.0,
        existing_savings REAL DEFAULT 0.0,
        debt_obligations REAL DEFAULT 0.0,
        preferred_savings REAL DEFAULT 0.0,
        debt_in_fixed INTEGER DEFAULT 0,
        is_onboarded INTEGER DEFAULT 0,
        is_demo INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Safe migration: ensure new columns exist if table was already created
    cursor.execute("PRAGMA table_info(users)")
    existing_cols = [row['name'] for row in cursor.fetchall()]
    if 'is_onboarded' not in existing_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN is_onboarded INTEGER DEFAULT 0")
    if 'is_demo' not in existing_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN is_demo INTEGER DEFAULT 0")
    if 'debt_in_fixed' not in existing_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN debt_in_fixed INTEGER DEFAULT 0")

    # Expenses table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        payment_method TEXT DEFAULT 'UPI/Bank Transfer',
        is_essential INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    # Financial Goals table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        target_amount REAL NOT NULL,
        current_amount REAL DEFAULT 0.0,
        target_date TEXT NOT NULL,
        priority TEXT DEFAULT 'Medium',
        monthly_contribution REAL DEFAULT 0.0,
        is_completed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    # Savings Plans table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS savings_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        monthly_income REAL NOT NULL,
        total_expenses REAL NOT NULL,
        debt_obligations REAL NOT NULL,
        monthly_surplus REAL NOT NULL,
        recommended_savings REAL NOT NULL,
        savings_rate REAL NOT NULL,
        plan_data_json TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    # Notifications table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    # AI Conversations & Scenario Simulation History table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ai_conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        scenario_data_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    # AI Spending Insights Cache/Log table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ai_insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        insights_type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    # Create helpful indexes for performance & isolation
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_plans_user ON savings_plans(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifications(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON ai_conversations(user_id)")

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database initialized & migrated successfully at", DB_PATH)
