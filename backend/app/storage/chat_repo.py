"""CRUD for chat history."""

from app.storage.db import get_db


def save_chat_message(student_name: str, role: str, content: str, intent: str = "") -> None:
    """Save a chat message to history."""
    with get_db() as conn:
        conn.execute(
            "INSERT INTO chat_history (student_name, role, content, intent) VALUES (?, ?, ?, ?)",
            (student_name, role, content, intent),
        )
