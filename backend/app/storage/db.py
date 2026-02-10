"""SQLite connection management."""

import logging
import os
import sqlite3
from contextlib import contextmanager

from app.settings import DB_PATH

log = logging.getLogger(__name__)


@contextmanager
def get_db():
    """Context manager for database connections."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
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
                student_id TEXT DEFAULT 'default',
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
                student_id TEXT DEFAULT 'default',
                student_name TEXT DEFAULT 'default',
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                intent TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS study_schedule (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT DEFAULT 'default',
                student_name TEXT DEFAULT 'default',
                topic TEXT NOT NULL,
                ease_factor REAL DEFAULT 2.5,
                interval_days INTEGER DEFAULT 1,
                repetitions INTEGER DEFAULT 0,
                next_review TEXT NOT NULL,
                last_reviewed TEXT,
                UNIQUE(student_id, topic)
            );
        """)
        # Ensure columns exist before creating indexes (handles old DBs)
        _ensure_column(conn, "quiz_results", "student_id", "TEXT DEFAULT 'default'")
        _ensure_column(conn, "chat_history", "student_id", "TEXT DEFAULT 'default'")
        _ensure_column(conn, "study_schedule", "student_id", "TEXT DEFAULT 'default'")
        _ensure_column(conn, "study_schedule", "student_name", "TEXT DEFAULT 'default'")
        conn.executescript("""
            CREATE INDEX IF NOT EXISTS idx_quiz_student
                ON quiz_results(student_id);
            CREATE INDEX IF NOT EXISTS idx_chat_student
                ON chat_history(student_id);
            CREATE INDEX IF NOT EXISTS idx_schedule_student
                ON study_schedule(student_id);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_student_topic
                ON study_schedule(student_id, topic);
        """)
    log.info("Database initialized: %s", DB_PATH)


def _ensure_column(conn: sqlite3.Connection, table: str, column: str, ddl: str) -> None:
    """Add a column if it doesn't exist (safe for initial deployment)."""
    cols = [row["name"] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()]
    if column not in cols:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")
