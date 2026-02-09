from fastapi import APIRouter

from app.settings import GEMINI_API_KEY, GEMINI_MODEL
from app.api.deps import search_engine

router = APIRouter()


@router.get("/health")
async def health_check():
    """System status check."""
    gemini_configured = bool(GEMINI_API_KEY and GEMINI_API_KEY != "your_api_key_here")
    return {
        "status": "healthy" if gemini_configured else "ok",
        "gemini_configured": gemini_configured,
        "gemini_model": GEMINI_MODEL,
        "materials_loaded": len(search_engine.chunks) > 0,
        "stats": search_engine.get_stats(),
    }
