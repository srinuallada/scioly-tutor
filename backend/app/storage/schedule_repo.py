"""Spaced repetition schedule storage using SM-2 algorithm."""

from datetime import date, timedelta

from app.storage.db import get_db


def update_schedule(student_name: str, topic: str, is_correct: bool) -> None:
    """
    Update the review schedule for a topic after a quiz answer.

    Uses a simplified SM-2 algorithm:
    - Correct answers increase the interval and ease factor
    - Incorrect answers reset the interval to 1 day
    """
    with get_db() as conn:
        row = conn.execute(
            "SELECT ease_factor, interval_days, repetitions FROM study_schedule "
            "WHERE student_name = ? AND topic = ?",
            (student_name, topic),
        ).fetchone()

        today = date.today().isoformat()

        if row is None:
            ease = 2.5
            interval = 1
            reps = 0
        else:
            ease = row["ease_factor"]
            interval = row["interval_days"]
            reps = row["repetitions"]

        if is_correct:
            reps += 1
            if reps == 1:
                interval = 1
            elif reps == 2:
                interval = 3
            else:
                interval = round(interval * ease)
            ease = max(1.3, ease + 0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02))
        else:
            reps = 0
            interval = 1
            ease = max(1.3, ease - 0.2)

        next_review = (date.today() + timedelta(days=interval)).isoformat()

        conn.execute(
            """INSERT INTO study_schedule
               (student_name, topic, ease_factor, interval_days, repetitions, next_review, last_reviewed)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(student_name, topic)
               DO UPDATE SET ease_factor=?, interval_days=?, repetitions=?, next_review=?, last_reviewed=?""",
            (student_name, topic, ease, interval, reps, next_review, today,
             ease, interval, reps, next_review, today),
        )


def get_study_plan(student_name: str) -> dict:
    """
    Get the study plan for a student.

    Returns topics due for review, upcoming reviews, and mastered topics.
    """
    today = date.today().isoformat()

    with get_db() as conn:
        due = conn.execute(
            """SELECT topic, next_review, interval_days, repetitions, last_reviewed
               FROM study_schedule
               WHERE student_name = ? AND next_review <= ?
               ORDER BY next_review ASC""",
            (student_name, today),
        ).fetchall()

        upcoming = conn.execute(
            """SELECT topic, next_review, interval_days, repetitions
               FROM study_schedule
               WHERE student_name = ? AND next_review > ?
               ORDER BY next_review ASC LIMIT 10""",
            (student_name, today),
        ).fetchall()

        mastered = conn.execute(
            """SELECT COUNT(*) as count FROM study_schedule
               WHERE student_name = ? AND interval_days >= 14""",
            (student_name,),
        ).fetchone()

        streak = conn.execute(
            """SELECT COUNT(DISTINCT date(timestamp)) as days
               FROM quiz_results
               WHERE student_name = ? AND timestamp >= date('now', '-30 days')""",
            (student_name,),
        ).fetchone()

    return {
        "due_for_review": [
            {
                "topic": r["topic"],
                "next_review": r["next_review"],
                "interval_days": r["interval_days"],
                "repetitions": r["repetitions"],
                "last_reviewed": r["last_reviewed"],
            }
            for r in due
        ],
        "upcoming": [
            {
                "topic": r["topic"],
                "next_review": r["next_review"],
                "interval_days": r["interval_days"],
            }
            for r in upcoming
        ],
        "mastered_count": mastered["count"] if mastered else 0,
        "study_days_30d": streak["days"] if streak else 0,
    }
