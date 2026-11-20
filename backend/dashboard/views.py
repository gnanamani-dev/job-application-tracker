from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from applications.models import JobApplication

from .serializers import (
    ApplicationAnalyticsSerializer,
    DashboardSummarySerializer,
    RecentApplicationSerializer,
)


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Scope both the aggregate and the recent list to the JWT user's records.
        user_applications = JobApplication.objects.filter(user=request.user)
        counts = user_applications.aggregate(
            total_applications=Count("pk"),
            applied_count=Count(
                "pk", filter=Q(status=JobApplication.Status.APPLIED)
            ),
            interview_count=Count(
                "pk", filter=Q(status=JobApplication.Status.INTERVIEW)
            ),
            technical_round_count=Count(
                "pk", filter=Q(status=JobApplication.Status.TECHNICAL_ROUND)
            ),
            offer_count=Count("pk", filter=Q(status=JobApplication.Status.OFFER)),
            rejected_count=Count(
                "pk", filter=Q(status=JobApplication.Status.REJECTED)
            ),
        )

        latest = user_applications.order_by("-applied_date", "-created_at")[:5]
        payload = {
            **counts,
            "recent_applications": RecentApplicationSerializer(latest, many=True).data,
        }
        return Response(DashboardSummarySerializer(instance=payload).data)


class ApplicationAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # All analytics use only applications owned by the authenticated user.
        applications = JobApplication.objects.filter(user=request.user)

        # One grouped query builds the status distribution and the denominator.
        grouped_statuses = applications.values("status").annotate(count=Count("pk"))
        status_counts = {
            status_value: 0 for status_value, _label in JobApplication.Status.choices
        }
        total_applications = 0
        for row in grouped_statuses:
            total_applications += row["count"]
            if row["status"] in status_counts:
                status_counts[row["status"]] = row["count"]

        # TruncMonth groups dates in PostgreSQL; only months with applications appear.
        grouped_months = (
            applications.annotate(month_start=TruncMonth("applied_date"))
            .values("month_start")
            .annotate(application_count=Count("pk"))
            .order_by("month_start")
        )
        monthly_trends = [
            {
                "month": row["month_start"].month,
                "year": row["month_start"].year,
                "application_count": row["application_count"],
            }
            for row in grouped_months
        ]

        if total_applications:
            # Status is a current value, not a history of every stage reached.
            interview_rate = round(
                100
                * (
                    status_counts[JobApplication.Status.INTERVIEW]
                    + status_counts[JobApplication.Status.TECHNICAL_ROUND]
                )
                / total_applications,
                2,
            )
            offer_rate = round(
                100 * status_counts[JobApplication.Status.OFFER] / total_applications,
                2,
            )
        else:
            interview_rate = 0.0
            offer_rate = 0.0

        payload = {
            "applications_by_status": [
                {"status": status_value, "count": status_counts[status_value]}
                for status_value, _label in JobApplication.Status.choices
            ],
            "monthly_trends": monthly_trends,
            "interview_rate": interview_rate,
            "offer_rate": offer_rate,
        }
        return Response(ApplicationAnalyticsSerializer(instance=payload).data)
