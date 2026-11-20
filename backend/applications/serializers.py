from rest_framework import serializers

from .models import JobApplication


class JobApplicationSerializer(serializers.ModelSerializer):
    salary = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=0,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = JobApplication
        fields = (
            "id",
            "company",
            "role",
            "status",
            "applied_date",
            "location",
            "job_url",
            "salary",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
        extra_kwargs = {
            "company": {"required": True, "allow_blank": False, "trim_whitespace": True},
            "role": {"required": True, "allow_blank": False, "trim_whitespace": True},
            "status": {"required": True},
            "applied_date": {"required": True},
            "location": {"required": False, "allow_blank": True},
            "job_url": {"required": False, "allow_blank": True},
            "notes": {"required": False, "allow_blank": True},
        }
