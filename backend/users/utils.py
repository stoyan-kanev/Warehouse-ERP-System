from rest_framework_simplejwt.tokens import RefreshToken

def get_tokens_for_user(user):
    """
    Връща dict с { refresh: "...", access: "..." }
    на база SimpleJWT, без да пишем наше jwt.encode.
    """
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }
