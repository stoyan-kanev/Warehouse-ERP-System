from django.contrib.auth.hashers import check_password
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer
from .utils import get_tokens_for_user

User = get_user_model()


def set_tokens_cookies(response, access_token: str, refresh_token: str | None = None):
    # access cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="Strict",
        max_age=15 * 60,
    )

    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,
            samesite="Strict",
            max_age=7 * 24 * 60 * 60,
        )

    return response


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response(
                {"detail": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not check_password(password, user.password):
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        tokens = get_tokens_for_user(user)

        resp = Response(
            {
                "user": {
                    "id": user.id,
                    "email": user.email,
                },
                "detail": "login ok"
            },
            status=status.HTTP_200_OK,
        )

        set_tokens_cookies(resp, tokens["access"], tokens["refresh"])
        return resp


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        tokens = get_tokens_for_user(user)

        resp = Response(
            {
                "user": {
                    "id": user.id,
                    "email": user.email,
                },
                "detail": "register ok",
            },
            status=status.HTTP_201_CREATED,
        )

        set_tokens_cookies(resp, tokens["access"], tokens["refresh"])
        return resp


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resp = Response({"detail": "logged out"}, status=status.HTTP_200_OK)
        resp.delete_cookie("access_token")
        resp.delete_cookie("refresh_token")
        return resp


class RefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response(
                {"detail": "No refresh token cookie."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            token_obj = RefreshToken(refresh_token)
            new_access = str(token_obj.access_token)
        except (TokenError, InvalidToken):
            return Response(
                {"detail": "Invalid refresh token."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        resp = Response({"detail": "refreshed"}, status=status.HTTP_200_OK)
        # сложи новия access като cookie
        set_tokens_cookies(resp, new_access, refresh_token=None)
        return resp


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        })
