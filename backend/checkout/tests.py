from unittest.mock import patch

import requests
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from checkout.models import Checkout
from events.models import Event
from payments.models import Payment, Purchase


@override_settings(N8N_WEBHOOK_URL="http://n8n.test/hook", N8N_WEBHOOK_SECRET="test-secret")
class CheckoutPaymentTests(TestCase):
    def setUp(self):
        call_command("seed_demo_data")
        self.client = APIClient()
        self.other = APIClient()
        signup = self.client.post(
            "/api/auth/signup",
            {"name": "Brian", "email": "brian@example.com", "phone": "+254700000000", "password": "password"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {signup.data['token']}")
        other = self.other.post(
            "/api/auth/signup",
            {"name": "Amina", "email": "amina@example.com", "phone": "+254711111111", "password": "password"},
            format="json",
        )
        self.other.credentials(HTTP_AUTHORIZATION=f"Token {other.data['token']}")
        self.webhook = patch("events.services.requests.post")
        self.post = self.webhook.start()
        self.post.return_value.ok = True
        self.post.return_value.status_code = 200
        self.addCleanup(self.webhook.stop)

    def _start(self, client=None):
        client = client or self.client
        return client.post(
            "/api/checkouts",
            {
                "movieId": "the-last-harvest",
                "amount": 1,
                "name": "Brian",
                "email": "brian@example.com",
                "phone": "+254700000000",
            },
            format="json",
        )

    def test_checkout_uses_backend_price_and_blocks_other_customers(self):
        created = self._start()
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data["amount"], 500)
        self.assertEqual(created.data["status"], "started")
        self.assertTrue(created.data["created"])
        checkout_id = created.data["id"]
        self.assertTrue(Event.objects.filter(event_type="CHECKOUT_STARTED", checkout_id=checkout_id).exists())

        hidden = self.other.get(f"/api/checkouts/{checkout_id}")
        self.assertEqual(hidden.status_code, 404)

        abandoned = self.client.post(f"/api/checkouts/{checkout_id}/abandon", format="json")
        self.assertEqual(abandoned.status_code, 200)
        self.assertEqual(abandoned.data["checkout"]["status"], "abandoned")
        self.assertTrue(Event.objects.filter(event_type="CHECKOUT_ABANDONED", checkout_id=checkout_id).exists())

    def test_failed_and_successful_payment_then_watch(self):
        checkout_id = self._start().data["id"]

        failed = self.client.post(
            f"/api/checkouts/{checkout_id}/pay",
            {"payment_method": "mpesa", "outcome": "failed"},
            format="json",
        )
        self.assertEqual(failed.status_code, 200)
        self.assertEqual(failed.data["checkout"]["status"], "failed")
        payment = Payment.objects.get(checkout_id=checkout_id, status="failed")
        self.assertEqual(payment.failure_reason, "Demo decline. No charge was made.")
        self.assertTrue(Event.objects.filter(event_type="PAYMENT_FAILED", checkout_id=checkout_id).exists())

        paid = self.client.post(
            f"/api/checkouts/{checkout_id}/pay",
            {"paymentMethod": "mpesa", "outcome": "success"},
            format="json",
        )
        self.assertEqual(paid.status_code, 200)
        self.assertEqual(paid.data["purchase"]["amount"], 500)
        self.assertTrue(Purchase.objects.filter(checkout_id=checkout_id, status="completed").exists())
        self.assertTrue(Event.objects.filter(event_type="PAYMENT_COMPLETED", checkout_id=checkout_id).exists())
        self.assertTrue(Event.objects.filter(event_type="PURCHASE_COMPLETED", checkout_id=checkout_id).exists())
        self.assertEqual(Checkout.objects.get(pk=checkout_id).status, "paid")

        watched = self.client.post("/api/watch", {"movieId": "the-last-harvest"}, format="json")
        self.assertEqual(watched.status_code, 201)
        self.assertTrue(Event.objects.filter(event_type="WATCH_COMPLETED", movie_id="the-last-harvest").exists())

        denied = self.other.post("/api/watch", {"movieId": "the-last-harvest"}, format="json")
        self.assertEqual(denied.status_code, 403)

    def test_n8n_failure_keeps_the_event(self):
        self.post.side_effect = requests.ConnectionError("down")
        response = self.client.post(
            "/api/events",
            {"event": "SEARCH_PERFORMED", "metadata": {"q": "harvest"}},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["n8n"]["status"], "unavailable")
        self.assertTrue(Event.objects.filter(event_type="SEARCH_PERFORMED").exists())
        sent = response.data["n8n"]
        self.assertNotIn("test-secret", str(sent))

    def test_n8n_payload_uses_the_service_and_hides_the_secret(self):
        self._start()
        body = self.post.call_args.kwargs["json"]
        headers = self.post.call_args.kwargs["headers"]
        self.assertEqual(body["event_type"], "CHECKOUT_STARTED")
        self.assertEqual(body["movie"]["id"], "the-last-harvest")
        self.assertEqual(body["movie"]["price"], 500)
        self.assertEqual(body["customer"]["email"], "brian@example.com")
        self.assertEqual(headers["X-YakWetu-Webhook-Secret"], "test-secret")
        self.assertNotIn("test-secret", str(body))
