from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

User = get_user_model()


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password_confirmation = serializers.CharField(
        write_only=True, trim_whitespace=False
    )

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "password_confirmation")
        read_only_fields = ("id",)
        extra_kwargs = {"email": {"required": True, "allow_blank": False}}

    def validate_email(self, value):
        normalized_email = User.objects.normalize_email(value).strip()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError(
                "An account with this email address already exists."
            )
        return normalized_email

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirmation"]:
            raise serializers.ValidationError(
                {"password_confirmation": "The passwords do not match."}
            )

        candidate_user = User(
            username=attrs.get("username", ""),
            email=attrs.get("email", ""),
        )
        try:
            password_validation.validate_password(attrs["password"], candidate_user)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"password": error.messages}) from error
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirmation")
        return User.objects.create_user(**validated_data)


class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "date_joined")
        read_only_fields = fields
