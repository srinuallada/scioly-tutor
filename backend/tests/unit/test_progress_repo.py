"""Unit tests for progress repository keyed by student_id."""

import os
import sqlite3

import pytest

os.environ.setdefault("SCIOLY_TEST_MODE", "1")

from app.storage.db import init_db
from app.storage.progress_repo import save_quiz_result, get_progress, get_weak_areas


@pytest.fixture(autouse=True)
def fresh_db(tmp_path, monkeypatch):
    """Use a temporary database for each test."""
    db_path = str(tmp_path / "test.db")
    monkeypatch.setattr("app.settings.DB_PATH", db_path)
    monkeypatch.setattr("app.storage.db.DB_PATH", db_path)
    monkeypatch.setattr("app.storage.progress_repo.get_db", lambda: _get_test_db(db_path))
    init_db()
    yield


def _get_test_db(db_path):
    """Create a test database context manager."""
    from contextlib import contextmanager

    @contextmanager
    def _db():
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    return _db()


class TestProgressRepo:
    def test_progress_separate_by_student_id(self):
        save_quiz_result(
            student_id="alice@example.com",
            student_name="Alice",
            topic="Biology",
            question="Q1",
            student_answer="A",
            correct_answer="A",
            is_correct=True,
        )
        save_quiz_result(
            student_id="bob@example.com",
            student_name="Alice",
            topic="Biology",
            question="Q2",
            student_answer="B",
            correct_answer="A",
            is_correct=False,
        )

        progress_a = get_progress("alice@example.com")
        progress_b = get_progress("bob@example.com")

        assert progress_a["student_id"] == "alice@example.com"
        assert progress_b["student_id"] == "bob@example.com"
        assert progress_a["overall"]["total_questions"] == 1
        assert progress_b["overall"]["total_questions"] == 1
        assert progress_a["overall"]["correct"] == 1
        assert progress_b["overall"]["correct"] == 0

    def test_weak_areas_use_student_id(self):
        save_quiz_result(
            student_id="alice@example.com",
            student_name="Alice",
            topic="Chemistry",
            question="Q1",
            student_answer="B",
            correct_answer="A",
            is_correct=False,
        )
        weak = get_weak_areas("alice@example.com")
        assert "Chemistry" in weak
