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
    log.info("Database initialized: %s", DB_PATH)
