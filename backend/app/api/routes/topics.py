from fastapi import APIRouter

from app.api.deps import search_engine

router = APIRouter()


@router.get("/topics")
async def list_topics():
    """List all available study topics."""
    return {"topics": search_engine.get_all_topics(), "stats": search_engine.get_stats()}
