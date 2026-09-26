from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

User = get_user_model()


@override_settings(N8N_WEBHOOK_URL="")
class AuthApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.payload = {
            "name": "Brian",
            "email": "brian@example.com",
            "phone": "+254700000000",
            "password": "password",
        }

    def test_signup_login_logout_and_me(self):
        signup = self.client.post("/api/auth/signup", self.payload, format="json")
        self.assertEqual(signup.status_code, 201)
        self.assertEqual(signup.data["email"], "brian@example.com")
        self.assertIn("token", signup.data)
        self.assertNotIn("password", signup.data)
        user = User.objects.get(email="brian@example.com")
        self.assertTrue(user.check_password("password"))
        self.assertFalse(user.password == "password")
        self.assertTrue(hasattr(user, "profile"))

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {signup.data['token']}")
        me = self.client.get("/api/auth/me")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data["id"], str(user.pk))

        logged_out = self.client.post("/api/auth/logout")
        self.assertEqual(logged_out.status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)

        self.client.credentials()
        login = self.client.post(
            "/api/auth/login",
            {"email": "Brian@Example.com", "password": "password"},
            format="json",
        )
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.data["name"], "Brian")

    def test_duplicate_signup(self):
        self.client.post("/api/auth/signup", self.payload, format="json")
        again = self.client.post("/api/auth/signup", self.payload, format="json")
        self.assertEqual(again.status_code, 400)
        self.assertIn("already exists", again.data["detail"])
