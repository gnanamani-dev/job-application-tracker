from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from applications.models import JobApplication

User = get_user_model()
STRONG_PASSWORD = "Fjord!72AmberDials"


class DashboardSummaryAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="dashboard_user",
            email="dashboard@example.com",
            password=STRONG_PASSWORD,
        )
        self.other_user = User.objects.create_user(
            username="another_dashboard_user",
            email="another-dashboard@example.com",
            password=STRONG_PASSWORD,
        )
        self.url = reverse("dashboard-summary")
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {AccessToken.for_user(self.user)}"
        )

    def create_application(self, *, user=None, company, status_value, applied_date):
        return JobApplication.objects.create(
            user=user or self.user,
            company=company,
            role=f"{company} Engineer",
            status=status_value,
            applied_date=applied_date,
            location="Remote",
        )

    def test_empty_user_gets_zero_counts_and_empty_recent_list(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_applications"], 0)
        self.assertEqual(response.data["applied_count"], 0)
        self.assertEqual(response.data["interview_count"], 0)
        self.assertEqual(response.data["technical_round_count"], 0)
        self.assertEqual(response.data["offer_count"], 0)
        self.assertEqual(response.data["rejected_count"], 0)
        self.assertEqual(response.data["recent_applications"], [])

    def test_total_and_per_status_counts_only_include_current_user(self):
        statuses = (
            JobApplication.Status.APPLIED,
            JobApplication.Status.INTERVIEW,
            JobApplication.Status.TECHNICAL_ROUND,
            JobApplication.Status.OFFER,
            JobApplication.Status.REJECTED,
        )
        for index, status_value in enumerate(statuses, start=1):
            self.create_application(
                company=f"Company {index}",
                status_value=status_value,
                applied_date=date(2026, 11, index),
            )
        self.create_application(
            user=self.other_user,
            company="Private Company",
            status_value=JobApplication.Status.OFFER,
            applied_date=date(2026, 11, 20),
        )

        response = self.client.get(self.url)

        self.assertEqual(response.data["total_applications"], 5)
        self.assertEqual(response.data["applied_count"], 1)
        self.assertEqual(response.data["interview_count"], 1)
        self.assertEqual(response.data["technical_round_count"], 1)
        self.assertEqual(response.data["offer_count"], 1)
        self.assertEqual(response.data["rejected_count"], 1)
        self.assertNotIn(
            "Private Company",
            [item["company"] for item in response.data["recent_applications"]],
        )

    def test_recent_applications_are_latest_five_by_applied_date(self):
        applications = [
            self.create_application(
                company=f"Company {day}",
                status_value=JobApplication.Status.APPLIED,
                applied_date=date(2026, 11, day),
            )
            for day in range(1, 8)
        ]

        response = self.client.get(self.url)

        recent = response.data["recent_applications"]
        self.assertEqual(len(recent), 5)
        self.assertEqual(
            [item["id"] for item in recent],
            [application.id for application in reversed(applications[-5:])],
        )
        self.assertEqual(recent[0]["applied_date"], "2026-11-07")

    def test_response_contains_exact_summary_and_recent_fields(self):
        self.create_application(
            company="Northwind",
            status_value=JobApplication.Status.INTERVIEW,
            applied_date=date(2026, 11, 20),
        )

        response = self.client.get(self.url)

        self.assertEqual(
            set(response.data),
            {
                "total_applications",
                "applied_count",
                "interview_count",
                "technical_round_count",
                "offer_count",
                "rejected_count",
                "recent_applications",
            },
        )
        self.assertEqual(
            set(response.data["recent_applications"][0]),
            {"id", "company", "role", "status", "applied_date", "location"},
        )

    def test_unauthenticated_request_is_rejected(self):
        self.client.credentials()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_summary_uses_two_application_queries(self):
        self.create_application(
            company="Northwind",
            status_value=JobApplication.Status.APPLIED,
            applied_date=date(2026, 11, 20),
        )
        self.client.credentials()
        self.client.force_authenticate(user=self.user)

        with self.assertNumQueries(2):
            response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ApplicationAnalyticsAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="analytics_user",
            email="analytics@example.com",
            password=STRONG_PASSWORD,
        )
        self.other_user = User.objects.create_user(
            username="other_analytics_user",
            email="other-analytics@example.com",
            password=STRONG_PASSWORD,
        )
        self.url = reverse("application-analytics")
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {AccessToken.for_user(self.user)}"
        )

    def create_application(self, *, company, status_value, applied_date, user=None):
        return JobApplication.objects.create(
            user=user or self.user,
            company=company,
            role=f"{company} Engineer",
            status=status_value,
            applied_date=applied_date,
            location="Remote",
        )

    def add_sample_applications(self):
        sample = [
            ("Applied A", JobApplication.Status.APPLIED, date(2026, 4, 2)),
            ("Applied B", JobApplication.Status.APPLIED, date(2026, 4, 10)),
            ("Applied C", JobApplication.Status.APPLIED, date(2026, 6, 1)),
            ("Applied D", JobApplication.Status.APPLIED, date(2026, 6, 2)),
            ("Interview A", JobApplication.Status.INTERVIEW, date(2026, 5, 1)),
            ("Interview B", JobApplication.Status.INTERVIEW, date(2026, 5, 2)),
            ("Technical", JobApplication.Status.TECHNICAL_ROUND, date(2026, 5, 3)),
            ("Offer", JobApplication.Status.OFFER, date(2025, 12, 20)),
            ("Rejected A", JobApplication.Status.REJECTED, date(2026, 5, 5)),
            ("Rejected B", JobApplication.Status.REJECTED, date(2025, 12, 25)),
        ]
        for company, status_value, applied_date in sample:
            self.create_application(
                company=company,
                status_value=status_value,
                applied_date=applied_date,
            )

    def test_status_distribution_includes_all_statuses_and_correct_counts(self):
        self.add_sample_applications()

        response = self.client.get(self.url)

        self.assertEqual(
            response.data["applications_by_status"],
            [
                {"status": "Applied", "count": 4},
                {"status": "Interview", "count": 2},
                {"status": "Technical Round", "count": 1},
                {"status": "Offer", "count": 1},
                {"status": "Rejected", "count": 2},
            ],
        )

    def test_documented_analytics_url_is_available(self):
        response = self.client.get("/api/analytics/applications/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("applications_by_status", response.data)

    def test_monthly_trends_group_by_applied_month_and_sort_oldest_first(self):
        self.add_sample_applications()

        response = self.client.get(self.url)

        self.assertEqual(
            response.data["monthly_trends"],
            [
                {"month": 12, "year": 2025, "application_count": 2},
                {"month": 4, "year": 2026, "application_count": 2},
                {"month": 5, "year": 2026, "application_count": 4},
                {"month": 6, "year": 2026, "application_count": 2},
            ],
        )

    def test_interview_and_offer_rates_use_current_status_counts(self):
        self.add_sample_applications()

        response = self.client.get(self.url)

        # Interview rate = (2 Interview + 1 Technical Round) / 10 * 100.
        self.assertEqual(response.data["interview_rate"], 30.0)
        # Offer rate = 1 current Offer / 10 applications * 100.
        self.assertEqual(response.data["offer_rate"], 10.0)

    def test_empty_account_returns_zero_rates_and_empty_series(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            all(row["count"] == 0 for row in response.data["applications_by_status"])
        )
        self.assertEqual(response.data["monthly_trends"], [])
        self.assertEqual(response.data["interview_rate"], 0.0)
        self.assertEqual(response.data["offer_rate"], 0.0)

    def test_analytics_include_only_the_authenticated_users_records(self):
        self.create_application(
            company="My Interview",
            status_value=JobApplication.Status.INTERVIEW,
            applied_date=date(2026, 1, 5),
        )
        self.create_application(
            company="Private Offer",
            status_value=JobApplication.Status.OFFER,
            applied_date=date(2026, 1, 6),
            user=self.other_user,
        )

        response = self.client.get(self.url)

        self.assertEqual(response.data["applications_by_status"][0]["count"], 0)
        self.assertEqual(response.data["applications_by_status"][1]["count"], 1)
        self.assertEqual(response.data["applications_by_status"][3]["count"], 0)
        self.assertEqual(response.data["interview_rate"], 100.0)
        self.assertEqual(response.data["offer_rate"], 0.0)
        self.assertEqual(response.data["monthly_trends"][0]["application_count"], 1)

    def test_unauthenticated_request_is_rejected(self):
        self.client.credentials()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_response_structure_contains_rates_and_series(self):
        self.add_sample_applications()

        response = self.client.get(self.url)

        self.assertEqual(
            set(response.data),
            {
                "applications_by_status",
                "monthly_trends",
                "interview_rate",
                "offer_rate",
            },
        )
        self.assertEqual(
            set(response.data["applications_by_status"][0]), {"status", "count"}
        )
        self.assertEqual(
            set(response.data["monthly_trends"][0]),
            {"month", "year", "application_count"},
        )
        self.assertGreaterEqual(response.data["interview_rate"], 0)
        self.assertLessEqual(response.data["interview_rate"], 100)
        self.assertGreaterEqual(response.data["offer_rate"], 0)
        self.assertLessEqual(response.data["offer_rate"], 100)

    def test_analytics_uses_two_grouped_queries(self):
        self.add_sample_applications()
        self.client.credentials()
        self.client.force_authenticate(user=self.user)

        with self.assertNumQueries(2):
            response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
