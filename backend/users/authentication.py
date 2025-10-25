from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import exceptions

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header_auth = super().authenticate(request)
        if header_auth is not None:
            return header_auth

        raw_token = request.COOKIES.get("access_token")
        if raw_token is None:
            return None  #

        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)

        if user is None:
            raise exceptions.AuthenticationFailed("User not found", code="user_not_found")

        return (user, validated_token)
