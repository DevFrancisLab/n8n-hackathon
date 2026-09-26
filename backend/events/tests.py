from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from events.models import Event


@override_settings(N8N_WEBHOOK_URL="")
class EventApiTests(TestCase):
    def setUp(self):
        call_command("seed_demo_data")
        self.client = APIClient()
        signup = self.client.post(
            "/api/auth/signup",
            {"name": "Brian", "email": "brian@example.com", "phone": "+254700000000", "password": "password"},
            format="json",
        )
        self.token = signup.data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token}")

    def test_event_is_saved_and_invalid_event_is_rejected(self):
        created = self.client.post(
            "/api/events",
            {
                "id": "evt_test",
                "event": "MOVIE_VIEWED",
                "movie_id": "the-last-harvest",
                "timestamp": "2026-09-26T12:00:00Z",
                "metadata": {"display_name": "Brian"},
            },
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        self.assertTrue(created.data["saved"])
        self.assertEqual(created.data["n8n"]["status"], "not_configured")
        stored = Event.objects.get(client_event_id="evt_test")
        self.assertEqual(stored.event_type, "MOVIE_VIEWED")
        self.assertEqual(stored.movie_id, "the-last-harvest")
        self.assertEqual(stored.customer.email, "brian@example.com")

        duplicate = self.client.post(
            "/api/events",
            {"id": "evt_test", "event": "MOVIE_VIEWED", "movie_id": "the-last-harvest"},
            format="json",
        )
        self.assertEqual(duplicate.status_code, 201)
        self.assertEqual(duplicate.data["n8n"]["status"], "duplicate")
        self.assertEqual(Event.objects.filter(client_event_id="evt_test").count(), 1)

        rejected = self.client.post("/api/events", {"event": "NOT_AN_EVENT"}, format="json")
        self.assertEqual(rejected.status_code, 400)

        activity = self.client.get("/api/customers/me/activity")
        self.assertEqual(activity.status_code, 200)
        self.assertEqual(activity.data["results"][0]["event"], "MOVIE_VIEWED")
