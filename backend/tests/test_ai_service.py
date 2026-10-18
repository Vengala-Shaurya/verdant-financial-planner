import unittest
from unittest.mock import MagicMock, patch
from backend.services.ai_service import (
    generate_plan_ai_insights,
    generate_spending_insights,
    answer_financial_query,
    classify_query_intent,
    get_ai_status
)

class TestAIIntegration(unittest.TestCase):
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
        """Verify queries are classified into greeting, casual, hypothetical, financial, or general_knowledge."""
        self.assertEqual(classify_query_intent("hi"), "greeting")
        self.assertEqual(classify_query_intent("Hello VERDANT!"), "greeting")
        self.assertEqual(classify_query_intent("bruh"), "casual")
        self.assertEqual(classify_query_intent("yo"), "casual")
        self.assertEqual(classify_query_intent("What if income drops by 5000?"), "hypothetical")
        self.assertEqual(classify_query_intent("Why was this plan recommended?"), "financial")
        self.assertEqual(classify_query_intent("How can I reach my emergency fund sooner?"), "financial")
        self.assertEqual(classify_query_intent("Who is the president of India?"), "general_knowledge")
        self.assertEqual(classify_query_intent("What is the capital of France?"), "general_knowledge")

    def test_general_knowledge_routed_to_live_ai_when_available(self):
        """A general knowledge question must return the live LLM answer without personal surplus data."""
        res = answer_financial_query(self.sample_user, self.sample_goals, None, "Who is the president of India?")
        self.assertIn("Murmu", res['answer'])
        self.assertEqual(res['mode'], 'llm_active')
        self.assertNotIn("verified monthly surplus", res['answer'].lower())

    def test_general_knowledge_offline_fallback(self):
        """When AI is offline, general knowledge questions explain AI is offline instead of dumping surplus data."""
        with patch.dict('os.environ', {'GROQ_API_KEY': '', 'GEMINI_API_KEY': ''}):
            res = answer_financial_query(self.sample_user, self.sample_goals, None, "Who is the president of India?")
            self.assertEqual(res['mode'], 'deterministic_editorial')
            self.assertIn("AI Offline", res['answer'])
            self.assertNotIn("22,000", res['answer'])

    def test_greeting_receives_natural_greeting(self):
        """'hi' and 'hello' return a natural conversational welcome."""
        with patch.dict('os.environ', {'GROQ_API_KEY': '', 'GEMINI_API_KEY': ''}):
            res_hi = answer_financial_query(self.sample_user, self.sample_goals, None, "hi")
            self.assertIn("Hello Arjun Verma", res_hi['answer'])
            self.assertNotIn("Hypothetical Simulation Analysis", res_hi['answer'])

    def test_casual_slang_receives_witty_acknowledgment(self):
        """'bruh' returns a natural casual acknowledgment."""
        with patch.dict('os.environ', {'GROQ_API_KEY': '', 'GEMINI_API_KEY': ''}):
            res_bruh = answer_financial_query(self.sample_user, self.sample_goals, None, "bruh")
            self.assertIn("I hear you", res_bruh['answer'])

    def test_missing_financial_data_honestly_communicated(self):
        """When user has zero recorded income, missing data is communicated honestly."""
        with patch.dict('os.environ', {'GROQ_API_KEY': '', 'GEMINI_API_KEY': ''}):
            empty_user = {'name': 'Newbie', 'monthly_income': 0, 'fixed_expenses': 0, 'variable_expenses': 0, 'debt_obligations': 0, 'existing_savings': 0}
            res = answer_financial_query(empty_user, [], None, "How is my plan doing?")
            self.assertIn("no recorded take-home income", res['answer'].lower())

    def test_hypothetical_what_if_surplus_and_allocation(self):
        """Hypothetical income reduction by 5,000 recalculates surplus correctly from ₹22k to ₹17k."""
        res = answer_financial_query(self.sample_user, self.sample_goals, None, "What happens if income falls by ₹5,000?")
        self.assertTrue(res['scenario_simulation']['is_hypothetical'])
        self.assertEqual(res['scenario_simulation']['hypothetical_income'], 45000.0)
        self.assertEqual(res['scenario_simulation']['hypothetical_surplus'], 17000.0)

    def test_get_ai_status(self):
        """Verify get_ai_status returns online provider details."""
        status = get_ai_status()
        self.assertIn(status['status'], ('online', 'offline'))
        self.assertIn('provider', status)

if __name__ == '__main__':
    unittest.main()
