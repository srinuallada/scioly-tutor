"""
SQLite storage for study progress tracking.
Single file database — zero cost, zero setup, fully portable.
"""

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime


DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "study_progress.db")


@contextmanager
def get_db():
    """Context manager for database connections."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    """Create tables if they don't exist."""
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS quiz_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_name TEXT DEFAULT 'default',
                topic TEXT,
                question TEXT,
                student_answer TEXT,
                correct_answer TEXT,
                is_correct BOOLEAN,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_name TEXT DEFAULT 'default',
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                intent TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_quiz_student
                ON quiz_results(student_name);
            CREATE INDEX IF NOT EXISTS idx_chat_student
                ON chat_history(student_name);
        """)
    print(f"💾 Database initialized: {DB_PATH}")


def save_chat_message(student_name: str, role: str, content: str, intent: str = "") -> None:
    """Save a chat message to history."""
    with get_db() as conn:
        conn.execute(
            "INSERT INTO chat_history (student_name, role, content, intent) VALUES (?, ?, ?, ?)",
            (student_name, role, content, intent),
        )


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
        # Overall stats
        overall = conn.execute(
            """SELECT COUNT(*) as total,
                      SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct
               FROM quiz_results WHERE student_name = ?""",
            (student_name,),
        ).fetchone()

        total = overall["total"] or 0
        correct = overall["correct"] or 0

        # By topic
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

        # Recent activity
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
