from fastapi import APIRouter, Depends

from app.api.schemas.quiz import (
    QuizSubmission, QuizResult, QuizGenerateRequest, QuizGenerateResponse,
)
from app.api.deps import search_engine
from app.core.auth import require_auth
from app.services.quiz_service import submit_answer, generate_quiz

router = APIRouter()


@router.post("/quiz/submit", response_model=QuizResult)
async def submit_quiz(submission: QuizSubmission, auth: dict = Depends(require_auth)):
    """Record a quiz answer for progress tracking."""
    student_id = auth.get("email") or "default"
    result = submit_answer(
        student_id=student_id,
        student_name=submission.student_name,
        topic=submission.topic,
        question=submission.question,
        student_answer=submission.student_answer,
        correct_answer=submission.correct_answer,
    )
    return QuizResult(**result)


@router.post("/quiz/generate", response_model=QuizGenerateResponse)
async def generate_quiz_endpoint(request: QuizGenerateRequest, auth: dict = Depends(require_auth)):
    """Generate a quiz question for a specific topic."""
    _ = auth.get("email") or "default"
    result = await generate_quiz(
        topic=request.topic,
        search_engine=search_engine,
    )
    return QuizGenerateResponse(**result)
