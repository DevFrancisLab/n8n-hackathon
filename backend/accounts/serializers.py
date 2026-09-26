from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from accounts.models import User


class SignupSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=80, trim_whitespace=True)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, trim_whitespace=True, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with that email already exists.")
        return email

    def validate_name(self, value):
        name = value.strip()
        if len(name) < 2:
            raise serializers.ValidationError("Enter your name.")
        return name

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            name=validated_data["name"],
            phone=validated_data.get("phone", ""),
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


def user_payload(user, token=None):
    payload = {
        "id": str(user.pk),
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
    }
    if token is not None:
        payload["token"] = token
    return payload
