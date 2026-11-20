"""Views for account registration and the authenticated user's profile."""

from rest_framework.generics import CreateAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated

from .serializers import CurrentUserSerializer, RegistrationSerializer


class RegistrationView(CreateAPIView):
    """Create a user without returning any credential fields."""

    serializer_class = RegistrationSerializer
    permission_classes = [AllowAny]


class CurrentUserView(RetrieveAPIView):
    """Return only the user associated with the validated access token."""

    serializer_class = CurrentUserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
