import unittest
from backend.services.analysis_engine import (
    calculate_financial_health,
    calculate_goal_allocations,
    build_month_by_month_roadmap
)
from backend.services.ai_service import (
    generate_plan_ai_insights,
    generate_spending_insights,
    answer_financial_query
)

class TestFinancialEngineAndAI(unittest.TestCase):
    def test_financial_health_and_accounting_model(self):
        # Demo parameters: Income 50k, Fixed 15k, Var 10k, Debt 3k, Savings 40k
        res = calculate_financial_health(50000, 15000, 10000, 3000, 40000)
        self.assertEqual(res['total_expenses'], 25000.0)
        self.assertEqual(res['debt_obligations'], 3000.0)
        self.assertEqual(res['total_monthly_commitments'], 28000.0)
        self.assertEqual(res['monthly_surplus'], 22000.0)
        self.assertEqual(res['potential_surplus_rate'], 44.0)
        # Emergency runway tests
        self.assertEqual(res['emergency_runway_months'], 1.6)
        self.assertEqual(res['emergency_runway_detailed']['essential_only_months'], 1.6)
        self.assertEqual(res['emergency_runway_detailed']['including_debt_months'], 1.43)

    def test_goal_allocation_invariant(self):
        """Sum of monthly allocations <= max(0, surplus)"""
        surplus = 15000.0
        goals = [
            {'id': 1, 'name': 'Emergency Fund', 'category': 'Emergency', 'target_amount': 60000, 'current_amount': 10000, 'target_date': '2027-01-01', 'priority': 'High'},
            {'id': 2, 'name': 'Education Cert', 'category': 'Education', 'target_amount': 40000, 'current_amount': 5000, 'target_date': '2027-01-01', 'priority': 'Medium'},
            {'id': 3, 'name': 'Trip', 'category': 'Travel', 'target_amount': 30000, 'current_amount': 2000, 'target_date': '2027-01-01', 'priority': 'Low'}
        ]
        evaluated, total_alloc, warnings = calculate_goal_allocations(surplus, goals)
        self.assertLessEqual(total_alloc, surplus)
        # Emergency Fund has +2 extra priority boost and should get highest allocation
        self.assertGreater(evaluated[0]['allocated_monthly'], evaluated[1]['allocated_monthly'])
        self.assertGreater(evaluated[1]['allocated_monthly'], evaluated[2]['allocated_monthly'])

    def test_negative_and_zero_surplus_safety(self):
        # Deficit of 5,000
        surplus = -5000.0
        goals = [{'id': 1, 'name': 'Emergency', 'target_amount': 20000, 'current_amount': 0, 'target_date': '2027-01-01', 'priority': 'High'}]
        evaluated, total_alloc, warnings = calculate_goal_allocations(surplus, goals)
        self.assertEqual(total_alloc, 0.0)
        self.assertTrue('Unfeasible' in evaluated[0]['feasibility'])
        self.assertTrue(len(warnings) > 0)

    def test_completed_goal_handling(self):
        surplus = 10000.0
        goals = [
            {'id': 1, 'name': 'Laptop Goal', 'target_amount': 50000, 'current_amount': 50000, 'target_date': '2027-01-01', 'is_completed': 1},
            {'id': 2, 'name': 'Next Goal', 'target_amount': 20000, 'current_amount': 5000, 'target_date': '2027-01-01', 'priority': 'High'}
        ]
        evaluated, total_alloc, warnings = calculate_goal_allocations(surplus, goals)
        self.assertEqual(evaluated[0]['allocated_monthly'], 0.0)
        self.assertTrue(evaluated[0]['is_completed'])
        self.assertGreater(evaluated[1]['allocated_monthly'], 0.0)

    def test_ai_feature_a_plan_insights_fallback(self):
        plan_summary = {
            'financial_health': {'income': 50000, 'monthly_surplus': 22000, 'fixed_expenses': 15000, 'variable_expenses': 10000, 'debt_obligations': 3000},
            'recommended_monthly_savings': 21750,
            'recommended_savings_rate': 43.5,
            'unallocated_surplus_buffer': 250,
            'evaluated_goals': [],
            'suggested_reductions': [],
            'warnings': [],
            'actions_next_30_days': ['Automate savings']
        }
        res = generate_plan_ai_insights(plan_summary, user_name="Arjun")
        self.assertIn('provider', res)
        self.assertIn('narrative', res)
        self.assertTrue(len(res['narrative']) > 20)

    def test_ai_feature_b_spending_insights_fallback(self):
        sample_expenses = [
            {'id': 1, 'amount': 11000, 'category': 'Housing', 'description': 'Rent', 'date': '2026-10-01'},
            {'id': 2, 'amount': 5200, 'category': 'Food', 'description': 'Groceries', 'date': '2026-10-06'},
            {'id': 3, 'amount': 2000, 'category': 'Transport', 'description': 'Transit', 'date': '2026-10-04'},
            {'id': 4, 'amount': 2000, 'category': 'Utilities', 'description': 'Electricity', 'date': '2026-10-03'},
            {'id': 5, 'amount': 1500, 'category': 'Shopping', 'description': 'Books', 'date': '2026-10-14'},
        ]
        insights = generate_spending_insights(sample_expenses, income=50000, fixed_exp=15000, var_exp=10000)
        self.assertTrue(insights['has_sufficient_history'])
        self.assertEqual(insights['total_spent'], 21700.0)
        self.assertTrue(len(insights['top_categories']) > 0)
        self.assertEqual(insights['top_categories'][0]['category'], 'Housing')

    def test_ai_feature_c_hypothetical_what_if_simulation(self):
        user = {'monthly_income': 50000, 'fixed_expenses': 15000, 'variable_expenses': 10000, 'debt_obligations': 3000, 'existing_savings': 40000}
        goals = [{'id': 1, 'name': 'Emergency', 'target_amount': 90000, 'current_amount': 30000, 'target_date': '2027-04-30', 'priority': 'High'}]
        # What happens if income falls by 5,000?
        query = "What happens if my income falls by ₹5,000?"
        res = answer_financial_query(user, goals, None, query)
        self.assertIn('scenario_simulation', res)
        scenario = res['scenario_simulation']
        self.assertTrue(scenario['is_hypothetical'])
        self.assertEqual(scenario['hypothetical_income'], 45000.0)
        self.assertEqual(scenario['surplus_shift'], -5000.0)
        self.assertEqual(scenario['hypothetical_surplus'], 17000.0)
        self.assertIn('17,000', res['answer'])

if __name__ == '__main__':
    unittest.main()
