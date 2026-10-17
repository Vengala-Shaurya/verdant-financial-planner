import unittest
import json
import uuid
from backend.app import app
from backend.models.db import get_db_connection, init_db
from backend.models.seed_data import seed_demo_data

class TestAuthAndDataIsolation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        with app.app_context():
            init_db()
            seed_demo_data()

    def setUp(self):
        # Create fresh unauthenticated client for each test method
        self.client = app.test_client()

    def test_demo_login_arjun_verma(self):
        """Verifies Arjun Verma demo account gives immediate access to seeded baseline."""
        res = self.client.post('/api/auth/demo-login')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('token', data)
        self.assertEqual(data['user']['name'], 'Arjun Verma')
        self.assertEqual(data['user']['email'], 'demo@verdant.local')
        self.assertEqual(data['user']['monthly_income'], 50000.0)
        self.assertEqual(data['user']['fixed_expenses'], 15000.0)
        self.assertEqual(data['user']['variable_expenses'], 10000.0)
        self.assertEqual(data['user']['debt_obligations'], 3000.0)
        self.assertEqual(data['user']['existing_savings'], 40000.0)

    def test_registration_and_duplicate_rejection(self):
        """Verifies personal registration and duplicate case-insensitive email rejection."""
        unique_email = f"priya.{uuid.uuid4().hex[:6]}@verdant.local"
        reg_payload = {
            'name': 'Priya Test',
            'email': unique_email,
            'password': 'Password123!',
            'password_confirm': 'Password123!'
        }
        res1 = self.client.post('/api/auth/register', json=reg_payload)
        self.assertEqual(res1.status_code, 201)
        data1 = res1.get_json()
        self.assertIn('token', data1)
        self.assertEqual(data1['user']['email'], unique_email)
        self.assertEqual(data1['user']['is_onboarded'], 0)
        self.assertEqual(data1['user']['monthly_income'], 0.0)

        # Duplicate registration with uppercase email
        dup_payload = {
            'name': 'Priya Duplicate',
            'email': unique_email.upper(),
            'password': 'Password123!',
            'password_confirm': 'Password123!'
        }
        res2 = self.client.post('/api/auth/register', json=dup_payload)
        self.assertEqual(res2.status_code, 409)

    def test_personal_login_and_invalid_credentials(self):
        """Tests valid sign-in and bad credentials rejection."""
        # Bad login
        res_bad = self.client.post('/api/auth/login', json={'email': 'demo@verdant.local', 'password': 'wrongpassword'})
        self.assertEqual(res_bad.status_code, 401)

        # Using /demo-login
        res_demo = self.client.post('/api/auth/demo-login')
        self.assertEqual(res_demo.status_code, 200)

    def test_unauthenticated_protected_endpoint_access(self):
        """Endpoints must reject unauthenticated requests with 401."""
        unauth_client = app.test_client()
        res_expenses = unauth_client.get('/api/expenses/')
        self.assertEqual(res_expenses.status_code, 401)

        res_goals = unauth_client.get('/api/goals/')
        self.assertEqual(res_goals.status_code, 401)

        res_plan = unauth_client.post('/api/plans/generate', json={})
        self.assertEqual(res_plan.status_code, 401)

        res_ai = unauth_client.get('/api/ai/spending-insights')
        self.assertEqual(res_ai.status_code, 401)

    def test_strict_user_data_isolation_between_user_a_and_user_b(self):
        """User A must NEVER read, modify, or delete User B's records."""
        suffix = uuid.uuid4().hex[:6]
        email_a = f"alice.{suffix}@test.local"
        email_b = f"bob.{suffix}@test.local"

        client_a = app.test_client()
        res_a = client_a.post('/api/auth/register', json={
            'name': 'Alice User A',
            'email': email_a,
            'password': 'secretpasswordA',
            'password_confirm': 'secretpasswordA'
        })
        self.assertEqual(res_a.status_code, 201)
        token_a = res_a.get_json()['token']
        headers_a = {'Authorization': f'Bearer {token_a}'}

        # Complete User A onboarding
        client_a.post('/api/auth/onboarding', headers=headers_a, json={
            'monthly_income': 70000,
            'fixed_expenses': 25000,
            'variable_expenses': 15000,
            'existing_savings': 50000,
            'debt_obligations': 0,
            'initial_goal': {'name': 'Alice House Fund', 'category': 'Major Purchase', 'target_amount': 500000, 'current_amount': 20000, 'target_date': '2028-01-01', 'priority': 'High'}
        })

        # Add User A expense
        exp_res = client_a.post('/api/expenses/', headers=headers_a, json={
            'amount': 4500,
            'category': 'Rent',
            'date': '2026-10-15',
            'description': "Alice private rent",
            'is_essential': True
        })
        self.assertEqual(exp_res.status_code, 201)
        alice_expense_id = exp_res.get_json()['expense']['id']

        # Get User A's goal
        goals_a_res = client_a.get('/api/goals/', headers=headers_a)
        alice_goal_id = goals_a_res.get_json()['goals'][0]['id']

        # 2. Register User B with clean client
        client_b = app.test_client()
        res_b = client_b.post('/api/auth/register', json={
            'name': 'Bob User B',
            'email': email_b,
            'password': 'secretpasswordB',
            'password_confirm': 'secretpasswordB'
        })
        self.assertEqual(res_b.status_code, 201)
        token_b = res_b.get_json()['token']
        headers_b = {'Authorization': f'Bearer {token_b}'}

        # Check User B starts with ZERO expenses and ZERO goals
        b_expenses = client_b.get('/api/expenses/', headers=headers_b).get_json()['expenses']
        self.assertEqual(len(b_expenses), 0)

        b_goals = client_b.get('/api/goals/', headers=headers_b).get_json()['goals']
        self.assertEqual(len(b_goals), 0)

        # 3. Attempt cross-user access: User B tries to update or delete User A's expense
        exp_hack = client_b.put(f'/api/expenses/{alice_expense_id}', headers=headers_b, json={
            'amount': 99999,
            'category': 'Hacked',
            'date': '2026-10-16'
        })
        self.assertEqual(exp_hack.status_code, 404)

        exp_del = client_b.delete(f'/api/expenses/{alice_expense_id}', headers=headers_b)
        self.assertEqual(exp_del.status_code, 404)

        # 4. Attempt cross-user goal tampering: User B tries to contribute to User A's goal
        goal_hack = client_b.post(f'/api/goals/{alice_goal_id}/contribute', headers=headers_b, json={'amount': 1000})
        self.assertEqual(goal_hack.status_code, 404)

        # 5. User A verifies their expense was untouched
        a_expenses = client_a.get('/api/expenses/', headers=headers_a).get_json()['expenses']
        self.assertEqual(len(a_expenses), 1)
        self.assertEqual(a_expenses[0]['amount'], 4500.0)

    def test_onboarding_and_plan_synthesis_flow(self):
        """Verifies onboarding completes, marks is_onboarded=1, and generates plan from new user data."""
        suffix = uuid.uuid4().hex[:6]
        email_c = f"carol.{suffix}@test.local"
        client_c = app.test_client()

        res_c = client_c.post('/api/auth/register', json={
            'name': 'Carol Onboard',
            'email': email_c,
            'password': 'password123',
            'password_confirm': 'password123'
        })
        self.assertEqual(res_c.status_code, 201)
        token_c = res_c.get_json()['token']
        headers_c = {'Authorization': f'Bearer {token_c}'}

        # Perform onboarding
        onb_res = client_c.post('/api/auth/onboarding', headers=headers_c, json={
            'monthly_income': 90000,
            'fixed_expenses': 30000,
            'variable_expenses': 20000,
            'existing_savings': 100000,
            'debt_obligations': 5000,
            'debt_in_fixed': False,
            'currency': 'INR',
            'initial_goal': {
                'name': 'Carol Master Degree',
                'category': 'Education',
                'target_amount': 300000,
                'current_amount': 25000,
                'target_date': '2027-06-30',
                'priority': 'High'
            }
        })
        self.assertEqual(onb_res.status_code, 200)
        user_c = onb_res.get_json()['user']
        self.assertEqual(user_c['is_onboarded'], 1)
        self.assertEqual(user_c['monthly_income'], 90000.0)

        # Generate plan for Carol
        plan_res = client_c.post('/api/plans/generate', headers=headers_c)
        self.assertEqual(plan_res.status_code, 200)
        plan_data = plan_res.get_json()['plan']

        # Verify Carol's surplus: 90000 - 30000 - 20000 - 5000 = 35,000
        self.assertEqual(plan_data['financial_health']['monthly_surplus'], 35000.0)
        self.assertLessEqual(plan_data['recommended_monthly_savings'], 35000.0)

        # Save plan
        save_res = client_c.post('/api/plans/save', headers=headers_c, json={'plan': plan_data})
        self.assertEqual(save_res.status_code, 200)

        # Fetch active plan
        active_res = client_c.get('/api/plans/active', headers=headers_c)
        self.assertEqual(active_res.status_code, 200)
        self.assertEqual(active_res.get_json()['plan']['financial_health']['income'], 90000.0)

if __name__ == '__main__':
    unittest.main()
