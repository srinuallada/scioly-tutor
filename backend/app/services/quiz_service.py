"""Quiz service — grade answers and record results."""

from app.storage.progress_repo import save_quiz_result


def submit_answer(
    student_name: str,
    topic: str,
    question: str,
    student_answer: str,
    correct_answer: str,
) -> dict:
    """Grade a quiz answer and persist the result."""
    is_correct = student_answer.strip().lower() == correct_answer.strip().lower()

    save_quiz_result(
        student_name=student_name,
        topic=topic,
        question=question,
        student_answer=student_answer,
        correct_answer=correct_answer,
        is_correct=is_correct,
    )

    return {"is_correct": is_correct, "correct_answer": correct_answer}
