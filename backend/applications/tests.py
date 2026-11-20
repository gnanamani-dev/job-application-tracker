from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from .models import JobApplication

User = get_user_model()


class JobApplicationAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="owner_user",
            email="owner@example.com",
            password="Fjord!72AmberDials",
        )
        self.other_user = User.objects.create_user(
            username="other_user",
            email="other@example.com",
            password="Fjord!72AmberDials",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {AccessToken.for_user(self.user)}"
        )
        self.list_url = reverse("application-list")
        self.valid_payload = {
            "company": "Northwind Labs",
            "role": "Backend Engineer",
            "status": JobApplication.Status.APPLIED,
            "applied_date": "2026-11-20",
            "location": "Remote",
            "job_url": "https://jobs.example.com/backend-engineer",
            "salary": "95000.00",
            "notes": "Follow up next week.",
        }

    def create_application(self, user=None, **overrides):
        payload = {
            "company": "Northwind Labs",
            "role": "Backend Engineer",
            "status": JobApplication.Status.APPLIED,
            "applied_date": date(2026, 11, 20),
            "location": "Remote",
        }
        payload.update(overrides)
        return JobApplication.objects.create(user=user or self.user, **payload)

    def test_create_assigns_authenticated_user_and_ignores_supplied_owner(self):
        response = self.client.post(
            self.list_url,
            {**self.valid_payload, "user_id": self.other_user.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        application = JobApplication.objects.get(pk=response.data["id"])
        self.assertEqual(application.user, self.user)
        self.assertNotIn("user", response.data)
        self.assertNotIn("user_id", response.data)

    def test_list_only_returns_the_authenticated_users_applications(self):
        own_application = self.create_application(company="My company")
        self.create_application(user=self.other_user, company="Private company")

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], own_application.id)

    def test_retrieve_own_application(self):
        application = self.create_application()

        response = self.client.get(
            reverse("application-detail", args=[application.id])
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["company"], application.company)

    def test_cannot_retrieve_another_users_application(self):
        application = self.create_application(user=self.other_user)

        response = self.client.get(
            reverse("application-detail", args=[application.id])
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_updates_own_application(self):
        application = self.create_application()
        payload = {
            **self.valid_payload,
            "company": "Contoso",
            "status": JobApplication.Status.INTERVIEW,
        }

        response = self.client.put(
            reverse("application-detail", args=[application.id]),
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        application.refresh_from_db()
        self.assertEqual(application.company, "Contoso")
        self.assertEqual(application.status, JobApplication.Status.INTERVIEW)

    def test_patch_updates_only_supplied_fields(self):
        application = self.create_application()

        response = self.client.patch(
            reverse("application-detail", args=[application.id]),
            {"status": JobApplication.Status.OFFER},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        application.refresh_from_db()
        self.assertEqual(application.status, JobApplication.Status.OFFER)
        self.assertEqual(application.company, "Northwind Labs")

    def test_cannot_modify_another_users_application(self):
        application = self.create_application(user=self.other_user)

        response = self.client.patch(
            reverse("application-detail", args=[application.id]),
            {"company": "Changed by someone else"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        application.refresh_from_db()
        self.assertEqual(application.company, "Northwind Labs")

    def test_delete_removes_own_application(self):
        application = self.create_application()

        response = self.client.delete(
            reverse("application-detail", args=[application.id])
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(JobApplication.objects.filter(pk=application.id).exists())

    def test_cannot_delete_another_users_application(self):
        application = self.create_application(user=self.other_user)

        response = self.client.delete(
            reverse("application-detail", args=[application.id])
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(JobApplication.objects.filter(pk=application.id).exists())

    def test_all_endpoints_reject_unauthenticated_requests(self):
        application = self.create_application()
        detail_url = reverse("application-detail", args=[application.id])
        self.client.credentials()
        requests = [
            self.client.get(self.list_url),
            self.client.post(self.list_url, self.valid_payload, format="json"),
            self.client.get(detail_url),
            self.client.put(detail_url, self.valid_payload, format="json"),
            self.client.patch(detail_url, {"company": "No auth"}, format="json"),
            self.client.delete(detail_url),
        ]

        self.assertTrue(
            all(response.status_code == status.HTTP_401_UNAUTHORIZED for response in requests)
        )

    def test_required_company_and_role_are_validated(self):
        for field in ("company", "role"):
            payload = {**self.valid_payload, field: "   "}
            with self.subTest(field=field):
                response = self.client.post(self.list_url, payload, format="json")
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(field, response.data)

    def test_invalid_status_is_rejected(self):
        response = self.client.post(
            self.list_url,
            {**self.valid_payload, "status": "In progress"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)

    def test_negative_salary_is_rejected(self):
        response = self.client.post(
            self.list_url,
            {**self.valid_payload, "salary": "-0.01"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("salary", response.data)

    def test_invalid_date_and_url_are_rejected(self):
        for field, value in (("applied_date", "not-a-date"), ("job_url", "not-a-url")):
            with self.subTest(field=field):
                response = self.client.post(
                    self.list_url,
                    {**self.valid_payload, field: value},
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(field, response.data)

    def test_search_matches_company_and_role(self):
        company_match = self.create_application(company="Acme Robotics")
        role_match = self.create_application(
            company="Globex", role="Platform Reliability Engineer"
        )
        self.create_application(company="Other Company", role="Designer")

        company_response = self.client.get(self.list_url, {"search": "Acme"})
        role_response = self.client.get(self.list_url, {"search": "Reliability"})

        self.assertEqual([row["id"] for row in company_response.data["results"]], [company_match.id])
        self.assertEqual([row["id"] for row in role_response.data["results"]], [role_match.id])

    def test_status_and_location_filters_can_be_combined(self):
        match = self.create_application(
            company="Match", status=JobApplication.Status.INTERVIEW, location="Berlin"
        )
        self.create_application(
            company="Wrong status", status=JobApplication.Status.APPLIED, location="Berlin"
        )
        self.create_application(
            company="Wrong location", status=JobApplication.Status.INTERVIEW, location="Paris"
        )

        response = self.client.get(
            self.list_url, {"status": "Interview", "location": "berlin"}
        )

        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], match.id)

    def test_invalid_status_filter_returns_validation_error(self):
        response = self.client.get(self.list_url, {"status": "In progress"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)

    def test_can_order_by_applied_date(self):
        newest = self.create_application(company="Newest", applied_date=date(2026, 11, 20))
        oldest = self.create_application(company="Oldest", applied_date=date(2026, 1, 1))

        ascending = self.client.get(self.list_url, {"ordering": "applied_date"})
        descending = self.client.get(self.list_url, {"ordering": "-applied_date"})

        self.assertEqual(ascending.data["results"][0]["id"], oldest.id)
        self.assertEqual(descending.data["results"][0]["id"], newest.id)

    def test_list_is_paginated_and_page_size_is_configurable(self):
        for number in range(12):
            self.create_application(company=f"Company {number}")

        first_page = self.client.get(self.list_url, {"page_size": 5})
        third_page = self.client.get(self.list_url, {"page_size": 5, "page": 3})

        self.assertEqual(first_page.data["count"], 12)
        self.assertEqual(len(first_page.data["results"]), 5)
        self.assertEqual(len(third_page.data["results"]), 2)
