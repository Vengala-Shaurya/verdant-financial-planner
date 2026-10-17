import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from models.db import init_db
from models.seed_data import seed_demo_data

from routes.profile_routes import auth_bp
from routes.expense_routes import expense_bp
from routes.goal_routes import goal_bp
from routes.plan_routes import plan_bp
from routes.dashboard_routes import dash_bp

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(expense_bp, url_prefix='/api/expenses')
app.register_blueprint(goal_bp, url_prefix='/api/goals')
app.register_blueprint(plan_bp, url_prefix='/api/plans')
app.register_blueprint(dash_bp, url_prefix='/api/dashboard')

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'application': 'VERDANT Financial Planning System',
        'engine': 'Deterministic Priority Cash-Flow Waterfall & LLM Synthesis',
        'version': '1.0.0'
    })

# Initialize DB on start
with app.app_context():
    init_db()
    seed_demo_data()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"VERDANT backend starting on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
