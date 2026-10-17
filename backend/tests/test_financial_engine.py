import unittest
from backend.services.analysis_engine import calculate_financial_health, calculate_goal_allocations, build_month_by_month_roadmap

class TestFinancialEngine(unittest.TestCase):
    def test_financial_health_calculation(self):
        # Demo numbers: Income 50k, Fixed 15k, Var 10k, Debt 3k, Savings 40k
        res = calculate_financial_health(50000, 15000, 10000, 3000, 40000)
        self.assertEqual(res['total_expenses'], 25000)
        self.assertEqual(res['monthly_surplus'], 22000)
        self.assertEqual(res['savings_rate'], 44.0)
        self.assertEqual(res['emergency_runway_months'], 1.6)

    def test_goal_allocation_does_not_exceed_surplus(self):
        surplus = 10000
        goals = [
            {'id': 1, 'name': 'Emergency', 'category': 'Emergency Fund', 'target_amount': 50000, 'current_amount': 0, 'target_date': '2027-01-01', 'priority': 'High'},
            {'id': 2, 'name': 'Laptop', 'category': 'Electronics', 'target_amount': 80000, 'current_amount': 0, 'target_date': '2027-01-01', 'priority': 'Low'}
        ]
        evaluated, total_alloc, warnings = calculate_goal_allocations(surplus, goals)
        self.assertLessEqual(total_alloc, surplus)
        self.assertGreater(evaluated[0]['allocated_monthly'], evaluated[1]['allocated_monthly'])

    def test_negative_surplus_handling(self):
        surplus = -5000
        goals = [{'id': 1, 'name': 'Emergency', 'target_amount': 20000, 'current_amount': 0, 'target_date': '2027-01-01', 'priority': 'High'}]
        evaluated, total_alloc, warnings = calculate_goal_allocations(surplus, goals)
        self.assertEqual(total_alloc, 0.0)
        self.assertTrue('Unfeasible' in evaluated[0]['feasibility'])

if __name__ == '__main__':
    unittest.main()
