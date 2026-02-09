from fastapi import APIRouter

from app.api.schemas.quiz import QuizSubmission, QuizResult
from app.services.quiz_service import submit_answer

router = APIRouter()


@router.post("/quiz/submit", response_model=QuizResult)
async def submit_quiz(submission: QuizSubmission):
    """Record a quiz answer for progress tracking."""
    result = submit_answer(
        student_name=submission.student_name,
        topic=submission.topic,
        question=submission.question,
        student_answer=submission.student_answer,
        correct_answer=submission.correct_answer,
    )
    return QuizResult(**result)
