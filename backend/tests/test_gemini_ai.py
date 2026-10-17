import unittest
from unittest.mock import MagicMock, patch
from backend.services.ai_service import (
    generate_plan_ai_insights,
    generate_spending_insights,
    answer_financial_query,
    classify_query_intent,
    is_gemini_enabled,
    get_gemini_model_name
)

class TestGeminiAIIntegration(unittest.TestCase):
    def setUp(self):
        self.sample_user = {
            'name': 'Arjun Verma',
            'monthly_income': 50000,
            'fixed_expenses': 15000,
            'variable_expenses': 10000,
            'debt_obligations': 3000,
            'existing_savings': 40000
        }
        self.sample_goals = [
            {'id': 1, 'name': 'Emergency Cushion', 'target_amount': 90000, 'current_amount': 30000, 'target_date': '2027-04-30', 'priority': 'High'},
            {'id': 2, 'name': 'Executive AI Certification', 'target_amount': 50000, 'current_amount': 10000, 'target_date': '2026-12-31', 'priority': 'Medium'}
        ]

    def test_query_classification_intent(self):
        """Verify queries are classified into greeting, casual, hypothetical, or financial."""
        self.assertEqual(classify_query_intent("hi"), "greeting")
        self.assertEqual(classify_query_intent("Hello VERDANT!"), "greeting")
        self.assertEqual(classify_query_intent("bruh"), "casual")
        self.assertEqual(classify_query_intent("yo"), "casual")
        self.assertEqual(classify_query_intent("What if income drops by 5000?"), "hypothetical")
        self.assertEqual(classify_query_intent("Why was this plan recommended?"), "financial")
        self.assertEqual(classify_query_intent("How can I reach my emergency fund sooner?"), "financial")

    def test_greeting_receives_natural_greeting_not_generic_financial_dump(self):
        """'hi' and 'hello' must return a natural conversational welcome, not a generic financial response."""
        res_hi = answer_financial_query(self.sample_user, self.sample_goals, None, "hi")
        self.assertIn("Hello Arjun Verma", res_hi['answer'])
        self.assertNotIn("Hypothetical Simulation Analysis", res_hi['answer'])

    def test_casual_slang_receives_witty_acknowledgment(self):
        """'bruh' must return a natural casual acknowledgment rather than the same text as 'hi' or a what-if analysis."""
        res_bruh = answer_financial_query(self.sample_user, self.sample_goals, None, "bruh")
        self.assertIn("I hear you", res_bruh['answer'])
        self.assertNotIn("Hypothetical Simulation Analysis", res_bruh['answer'])

    def test_missing_financial_data_honestly_communicated(self):
        """When user has zero recorded income, the assistant states what information is missing instead of inventing numbers."""
        empty_user = {'name': 'Newbie', 'monthly_income': 0, 'fixed_expenses': 0, 'variable_expenses': 0, 'debt_obligations': 0, 'existing_savings': 0}
        res = answer_financial_query(empty_user, [], None, "How is my plan doing?")
        self.assertIn("no recorded take-home income", res['answer'].lower())

    def test_hypothetical_what_if_surplus_and_allocation(self):
        """Hypothetical income reduction by 5,000 recalculates surplus correctly from ₹22k to ₹17k."""
        res = answer_financial_query(self.sample_user, self.sample_goals, None, "What happens if income falls by ₹5,000?")
        self.assertTrue(res['scenario_simulation']['is_hypothetical'])
        self.assertEqual(res['scenario_simulation']['hypothetical_income'], 45000.0)
        self.assertEqual(res['scenario_simulation']['hypothetical_surplus'], 17000.0)
        self.assertIn("17,000", res['answer'])

    @patch('backend.services.ai_service.get_gemini_client')
    def test_live_gemini_mocked_plan_insights(self, mock_client_getter):
        """When Gemini client returns a response, mode is 'llm_active' with Google Gemini provider."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '''
        {
            "personalized_summary": "Arjun has structured an aggressive 44% savings discipline.",
            "allocation_rationales": ["Emergency Cushion prioritized for 3-month coverage"],
            "spending_observations": ["Fixed expenses are contained at 30%"],
            "discretionary_reductions": ["Trim entertainment by 10%"],
            "risks_and_tradeoffs": ["Secondary milestones delayed if shock occurs"],
            "action_plan_30_days": ["Set up SIP", "Review grocery bills"]
        }
        '''
        mock_client.models.generate_content.return_value = mock_response
        mock_client_getter.return_value = mock_client

        plan_summary = {
            'financial_health': {'income': 50000, 'monthly_surplus': 22000, 'fixed_expenses': 15000, 'variable_expenses': 10000, 'debt_obligations': 3000},
            'recommended_monthly_savings': 21750,
            'recommended_savings_rate': 43.5,
            'unallocated_surplus_buffer': 250,
            'evaluated_goals': self.sample_goals,
            'actions_next_30_days': []
        }
        res = generate_plan_ai_insights(plan_summary, user_name="Arjun")
        self.assertEqual(res['mode'], 'llm_active')
        self.assertIn('Google Gemini', res['provider'])
        self.assertIn('Arjun has structured', res['narrative'])

    @patch('backend.services.ai_service.get_gemini_client')
    def test_gemini_api_failure_graceful_fallback(self, mock_client_getter):
        """If Gemini API raises an exception (e.g. rate limit, network timeout), fallback engages safely."""
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = Exception("QuotaExceeded: 429 Resource has been exhausted")
        mock_client_getter.return_value = mock_client

        res = answer_financial_query(self.sample_user, self.sample_goals, None, "hi")
        self.assertEqual(res['mode'], 'deterministic_editorial')
        self.assertIn('Hello Arjun Verma', res['answer'])
        self.assertNotIn("QuotaExceeded", res['answer'])

    def test_missing_api_key_does_not_crash(self):
        """When GEMINI_API_KEY is not set or empty, all 3 AI functions return valid responses."""
        with patch.dict('os.environ', {'GEMINI_API_KEY': ''}):
            plan_res = generate_plan_ai_insights({'financial_health': {'income': 50000, 'monthly_surplus': 22000, 'fixed_expenses': 15000, 'variable_expenses': 10000, 'debt_obligations': 3000}}, "Arjun")
            self.assertEqual(plan_res['mode'], 'deterministic_editorial')

            spend_res = generate_spending_insights([], 50000, 15000, 10000)
            self.assertEqual(spend_res['mode'], 'deterministic_editorial')

            query_res = answer_financial_query(self.sample_user, [], None, "What if rent goes up by 2000?")
            self.assertEqual(query_res['mode'], 'deterministic_editorial')
            self.assertTrue(query_res['scenario_simulation']['is_hypothetical'])

if __name__ == '__main__':
    unittest.main()
