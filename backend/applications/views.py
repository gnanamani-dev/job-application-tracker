from rest_framework import filters, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from .models import JobApplication
from .pagination import ApplicationPagination
from .serializers import JobApplicationSerializer


class JobApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ApplicationPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["company", "role"]
    ordering_fields = ["applied_date"]
    ordering = ["-applied_date", "-created_at"]

    def get_queryset(self):
        # Ownership is applied before any user-controlled filter or lookup.
        queryset = JobApplication.objects.filter(user=self.request.user)
        status_value = self.request.query_params.get("status")
        if status_value:
            valid_statuses = JobApplication.Status.values
            if status_value not in valid_statuses:
                raise ValidationError(
                    {"status": f"Choose one of: {', '.join(valid_statuses)}."}
                )
            queryset = queryset.filter(status=status_value)

        location = self.request.query_params.get("location", "").strip()
        if location:
            queryset = queryset.filter(location__icontains=location)
        return queryset

    def perform_create(self, serializer):
        # Never accept an owner ID from the request body.
        serializer.save(user=self.request.user)
