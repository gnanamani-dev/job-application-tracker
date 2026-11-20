from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()
STRONG_PASSWORD = "Fjord!72AmberDials"


class RegistrationAPITests(APITestCase):
    def setUp(self):
        self.url = reverse("auth-register")
        self.payload = {
            "username": "morgan_writer",
            "email": "morgan@example.com",
            "password": STRONG_PASSWORD,
            "password_confirmation": STRONG_PASSWORD,
        }

    def test_registration_hashes_password_and_returns_safe_user_data(self):
        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["username"], self.payload["username"])
        self.assertEqual(response.data["email"], self.payload["email"])
        self.assertNotIn("password", response.data)
        self.assertNotIn("password_confirmation", response.data)
        user = User.objects.get(username=self.payload["username"])
        self.assertTrue(user.check_password(STRONG_PASSWORD))
        self.assertNotEqual(user.password, STRONG_PASSWORD)

    def test_duplicate_username_is_rejected(self):
        User.objects.create_user(
            username=self.payload["username"],
            email="different@example.com",
            password=STRONG_PASSWORD,
        )

        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_duplicate_email_is_rejected_case_insensitively(self):
        User.objects.create_user(
            username="another_user",
            email=self.payload["email"],
            password=STRONG_PASSWORD,
        )
        self.payload["email"] = self.payload["email"].upper()

        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_common_password_is_rejected(self):
        self.payload["password"] = "password"
        self.payload["password_confirmation"] = "password"

        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_password_confirmation_must_match(self):
        self.payload["password_confirmation"] = "Different!Password2026"

        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_confirmation", response.data)


class TokenAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="jordan_dev",
            email="jordan@example.com",
            password=STRONG_PASSWORD,
        )

    def test_login_returns_access_and_refresh_tokens(self):
        response = self.client.post(
            reverse("token-obtain-pair"),
            {"username": self.user.username, "password": STRONG_PASSWORD},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_invalid_login_is_rejected(self):
        response = self.client.post(
            reverse("token-obtain-pair"),
            {"username": self.user.username, "password": "wrong-password"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_returns_new_access_token(self):
        token_response = self.client.post(
            reverse("token-obtain-pair"),
            {"username": self.user.username, "password": STRONG_PASSWORD},
            format="json",
        )
        response = self.client.post(
            reverse("token-refresh"),
            {"refresh": token_response.data["refresh"]},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_current_user_requires_authentication(self):
        response = self.client.get(reverse("auth-me"))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_current_user_returns_authenticated_user_without_password(self):
        token_response = self.client.post(
            reverse("token-obtain-pair"),
            {"username": self.user.username, "password": STRONG_PASSWORD},
            format="json",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token_response.data['access']}"
        )

        response = self.client.get(reverse("auth-me"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.user.id)
        self.assertEqual(response.data["username"], self.user.username)
        self.assertNotIn("password", response.data)
