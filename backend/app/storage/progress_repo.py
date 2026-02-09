"""CRUD for quiz results and progress tracking."""

from app.storage.db import get_db


def save_quiz_result(
    student_name: str,
    topic: str,
    question: str,
    student_answer: str,
    correct_answer: str,
    is_correct: bool,
) -> None:
    """Record a quiz answer."""
    with get_db() as conn:
        conn.execute(
            """INSERT INTO quiz_results
               (student_name, topic, question, student_answer, correct_answer, is_correct)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (student_name, topic, question, student_answer, correct_answer, is_correct),
        )


def get_progress(student_name: str = "default") -> dict:
    """Get study progress and weak areas for a student."""
    with get_db() as conn:
        overall = conn.execute(
            """SELECT COUNT(*) as total,
                      SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct
               FROM quiz_results WHERE student_name = ?""",
            (student_name,),
        ).fetchone()

        total = overall["total"] or 0
        correct = overall["correct"] or 0

        by_topic = conn.execute(
            """SELECT topic,
                      COUNT(*) as total,
                      SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct
               FROM quiz_results
               WHERE student_name = ?
               GROUP BY topic
               ORDER BY (CAST(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*))""",
            (student_name,),
        ).fetchall()

        recent = conn.execute(
            """SELECT topic, question, is_correct, timestamp
               FROM quiz_results
               WHERE student_name = ?
               ORDER BY timestamp DESC LIMIT 20""",
            (student_name,),
        ).fetchall()

        topics = []
        weak_areas = []
        for row in by_topic:
            accuracy = round(row["correct"] / row["total"] * 100, 1) if row["total"] > 0 else 0
            topics.append({
                "topic": row["topic"],
                "total": row["total"],
                "correct": row["correct"],
                "accuracy": accuracy,
            })
            if accuracy < 70:
                weak_areas.append(row["topic"])

        return {
            "student_name": student_name,
            "overall": {
                "total_questions": total,
                "correct": correct,
                "accuracy": round(correct / total * 100, 1) if total > 0 else 0,
            },
            "by_topic": topics,
            "weak_areas": weak_areas,
            "recent_activity": [dict(row) for row in recent],
        }


def get_weak_areas(student_name: str = "default") -> list[str]:
    """Get list of weak topic areas (< 70% accuracy)."""
    progress = get_progress(student_name)
    return progress["weak_areas"]
