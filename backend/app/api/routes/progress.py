from fastapi import APIRouter

from app.services.progress_service import get_student_progress
from app.storage.schedule_repo import get_study_plan

router = APIRouter()


@router.get("/progress/{student_name}")
async def student_progress(student_name: str = "default"):
    """Get study progress and weak areas."""
    return get_student_progress(student_name)


@router.get("/study-plan/{student_name}")
async def study_plan(student_name: str = "default"):
    """Get spaced repetition study plan with topics due for review."""
    return get_study_plan(student_name)
