from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
User = get_user_model()

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"detail": "Invalid email or password"})

        if not user.check_password(password):
            raise serializers.ValidationError({"detail": "Invalid email or password"})

        data = super().validate({
            "username": user.email,
            "password": password
        })
        return data





class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "first_name","last_name", "password")

        extra_kwargs = {
            "email": {"required": True},
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email is already registered.")
        return value


    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        return user


class MeUpdateSerializer(serializers.ModelSerializer):
    current_password = serializers.CharField(write_only=True, required=False, allow_blank=False)
    new_password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "current_password", "new_password")

    def validate(self, attrs):
        user = self.context["request"].user

        new_password = attrs.get("new_password")
        current_password = attrs.get("current_password")

        if new_password is not None:
            if not current_password:
                raise serializers.ValidationError({
                    "current_password": "Current password is required to change your password."
                })

            if not user.check_password(current_password):
                raise serializers.ValidationError({
                    "current_password": "Current password is incorrect."
                })

            # Use Django password validators
            try:
                validate_password(new_password, user=user)
            except DjangoValidationError as e:
                raise serializers.ValidationError({"new_password": list(e.messages)})

        return attrs
    def update(self, instance, validated_data):
        # Pop password fields so they don’t go into normal update
        new_password = validated_data.pop("new_password", None)
        validated_data.pop("current_password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if new_password is not None:
            instance.set_password(new_password)  # hashes properly

        instance.save()
        return instance