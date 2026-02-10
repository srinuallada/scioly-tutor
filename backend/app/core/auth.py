"""Google ID token authentication helpers."""

from fastapi import Header, HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.settings import GOOGLE_CLIENT_ID, REQUIRE_AUTH, ALLOWED_EMAILS

_request = google_requests.Request()


def require_auth(authorization: str | None = Header(default=None)) -> dict:
    if not REQUIRE_AUTH:
        return {"sub": "dev", "email": "dev@local"}

    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID not configured")

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    token = authorization.split(" ", 1)[1]
    try:
        claims = id_token.verify_oauth2_token(token, _request, GOOGLE_CLIENT_ID)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    if ALLOWED_EMAILS:
        email = (claims.get("email") or "").lower()
        if email not in ALLOWED_EMAILS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Your account is not authorized.",
            )

    return claims
