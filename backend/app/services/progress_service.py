"""Progress service — fetch student analytics."""

from app.storage.progress_repo import get_progress as _get_progress


def get_student_progress(student_id: str) -> dict:
    """Get full progress data for a student."""
    return _get_progress(student_id)
