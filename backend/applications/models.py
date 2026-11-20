from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class JobApplication(models.Model):
    class Status(models.TextChoices):
        APPLIED = "Applied", "Applied"
        INTERVIEW = "Interview", "Interview"
        TECHNICAL_ROUND = "Technical Round", "Technical Round"
        OFFER = "Offer", "Offer"
        REJECTED = "Rejected", "Rejected"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    company = models.CharField(max_length=150)
    role = models.CharField(max_length=150)
    status = models.CharField(max_length=30, choices=Status.choices)
    applied_date = models.DateField()
    location = models.CharField(max_length=150, blank=True)
    job_url = models.URLField(max_length=500, blank=True)
    salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-applied_date", "-created_at")
        indexes = [models.Index(fields=("user", "status"), name="jobapp_user_status_idx")]

    def __str__(self):
        return f"{self.role} at {self.company}"
