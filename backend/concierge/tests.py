from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient


class ConciergeTests(TestCase):
    def setUp(self):
        call_command("seed_demo_data")
        self.client = APIClient()

    def test_kenyan_thriller_is_deterministic(self):
        response = self.client.post("/api/concierge", {"prompt": "Kenyan thriller"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["movie_id"], "the-last-harvest")
        self.assertIn("Kenyan thrillers", response.data["reason"])

    def test_empty_prompt_is_rejected(self):
        response = self.client.post("/api/concierge", {"prompt": "  "}, format="json")
        self.assertEqual(response.status_code, 400)
