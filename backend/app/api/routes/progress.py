from fastapi import APIRouter, Depends

from app.services.progress_service import get_student_progress
from app.storage.schedule_repo import get_study_plan
from app.core.auth import require_auth

router = APIRouter()


@router.get("/progress")
async def student_progress(auth: dict = Depends(require_auth)):
    """Get study progress and weak areas."""
    student_id = auth.get("email") or "default"
    return get_student_progress(student_id)


@router.get("/study-plan")
async def study_plan(auth: dict = Depends(require_auth)):
    """Get spaced repetition study plan with topics due for review."""
    student_id = auth.get("email") or "default"
    return get_study_plan(student_id)
