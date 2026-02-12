"""Google ID token authentication helpers."""

import logging
from fastapi import APIRouter, Depends, Header, HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.settings import GOOGLE_CLIENT_ID, REQUIRE_AUTH, ALLOWED_EMAILS

log = logging.getLogger(__name__)

_request = google_requests.Request()

router = APIRouter()

log.info("Auth config: REQUIRE_AUTH=%s, GOOGLE_CLIENT_ID=%s, ALLOWED_EMAILS_COUNT=%d",
         REQUIRE_AUTH, bool(GOOGLE_CLIENT_ID), len(ALLOWED_EMAILS))


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
    except Exception as e:
        log.warning("Token verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    email = (claims.get("email") or "").lower()

    if ALLOWED_EMAILS:
        if email not in ALLOWED_EMAILS:
            log.warning("Access denied for email: %s", email)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Your account is not authorized.",
            )

    return claims


@router.get("/auth/verify")
async def verify_auth(claims: dict = Depends(require_auth)):
    """Verify token and check if user is authorized. Called by frontend after Google sign-in."""
    return {"email": claims.get("email", ""), "authorized": True}
