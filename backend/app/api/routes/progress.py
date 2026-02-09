from fastapi import APIRouter

from app.services.progress_service import get_student_progress

router = APIRouter()


@router.get("/progress/{student_name}")
async def student_progress(student_name: str = "default"):
    """Get study progress and weak areas."""
    return get_student_progress(student_name)
