from django.urls import path

from .views import ApplicationAnalyticsView, DashboardSummaryView

urlpatterns = [
    path("summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path(
        "applications/",
        ApplicationAnalyticsView.as_view(),
        name="application-analytics",
    ),
]
