from rest_framework import serializers

from applications.models import JobApplication


class RecentApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ("id", "company", "role", "status", "applied_date", "location")
        read_only_fields = fields


class DashboardSummarySerializer(serializers.Serializer):
    total_applications = serializers.IntegerField()
    applied_count = serializers.IntegerField()
    interview_count = serializers.IntegerField()
    technical_round_count = serializers.IntegerField()
    offer_count = serializers.IntegerField()
    rejected_count = serializers.IntegerField()
    recent_applications = RecentApplicationSerializer(many=True)


class StatusCountSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=JobApplication.Status.choices)
    count = serializers.IntegerField(min_value=0)


class MonthlyTrendSerializer(serializers.Serializer):
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField()
    application_count = serializers.IntegerField(min_value=0)


class ApplicationAnalyticsSerializer(serializers.Serializer):
    """Rates use current status because this app does not store status history."""

    applications_by_status = StatusCountSerializer(many=True)
    monthly_trends = MonthlyTrendSerializer(many=True)
    interview_rate = serializers.FloatField(
        min_value=0,
        max_value=100,
        help_text=(
            "Percentage: (currently Interview + currently Technical Round) "
            "divided by all current-user applications, multiplied by 100."
        ),
    )
    offer_rate = serializers.FloatField(
        min_value=0,
        max_value=100,
        help_text=(
            "Percentage: currently Offer applications divided by all "
            "current-user applications, multiplied by 100."
        ),
    )
