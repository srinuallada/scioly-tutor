from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import FileResponse
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.settings import IMAGES_DIR, GOOGLE_CLIENT_ID, REQUIRE_AUTH

router = APIRouter()

_request = google_requests.Request()


@router.get("/images/{filename}")
async def get_image(
    filename: str,
    token: str | None = Query(default=None),
    authorization: str | None = Header(default=None),
):
    """Serve images. Auth via ?token= query param, or Authorization header."""
    if REQUIRE_AUTH:
        # Accept token from query param or Authorization header
        jwt = token
        if not jwt and authorization and authorization.startswith("Bearer "):
            jwt = authorization.split(" ", 1)[1]
        if not jwt:
            raise HTTPException(status_code=401, detail="Missing token")
        try:
            id_token.verify_oauth2_token(jwt, _request, GOOGLE_CLIENT_ID)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")

    base = IMAGES_DIR.resolve()
    path = (IMAGES_DIR / filename).resolve()
    if not str(path).startswith(str(base)):
        raise HTTPException(status_code=404, detail="Image not found")

    # If exact filename not found, try common image extensions
    # (Gemini sometimes strips the extension from image paths)
    if not path.exists() and not path.suffix:
        for ext in (".png", ".jpg", ".jpeg", ".gif", ".webp"):
            candidate = path.with_suffix(ext)
            if candidate.exists():
                path = candidate
                break

    if not path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(path)
