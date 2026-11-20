from django.contrib import admin
from django.urls import include, path
from dashboard.views import ApplicationAnalyticsView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/applications/", include("applications.urls")),
    path("api/dashboard/", include("dashboard.urls")),
    # The analytics view was originally mounted under dashboard.urls. Keep that
    # path working while also exposing the documented analytics endpoint.
    path(
        "api/analytics/applications/",
        ApplicationAnalyticsView.as_view(),
        name="analytics-applications",
    ),
]
