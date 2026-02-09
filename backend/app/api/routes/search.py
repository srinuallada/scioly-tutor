from fastapi import APIRouter

from app.api.deps import search_engine
from app.services.search_service import search_materials

router = APIRouter()


@router.get("/search")
async def search_endpoint(query: str, top_k: int = 5):
    """Search materials directly."""
    return search_materials(query, top_k, search_engine)
