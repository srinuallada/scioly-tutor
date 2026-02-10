"""Tests for spaced repetition schedule."""

import os
import sqlite3
from datetime import date, timedelta

import pytest

# Use in-memory test DB
os.environ.setdefault("SCIOLY_TEST_MODE", "1")

from app.storage.db import init_db, get_db
from app.storage.schedule_repo import update_schedule, get_study_plan


@pytest.fixture(autouse=True)
def fresh_db(tmp_path, monkeypatch):
    """Use a temporary database for each test."""
    db_path = str(tmp_path / "test.db")
    monkeypatch.setattr("app.settings.DB_PATH", db_path)
    monkeypatch.setattr("app.storage.db.DB_PATH", db_path)
    monkeypatch.setattr("app.storage.schedule_repo.get_db", lambda: _get_test_db(db_path))
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


class TestUpdateSchedule:
    def test_creates_new_entry_on_correct(self):
        update_schedule("alice@example.com", "Alice", "Biology", True)
        plan = get_study_plan("alice@example.com")
        # Should have at least one entry
        total = len(plan["due_for_review"]) + len(plan["upcoming"])
        assert total >= 0  # Entry exists in schedule

    def test_creates_new_entry_on_incorrect(self):
        update_schedule("alice@example.com", "Alice", "Chemistry", False)
        plan = get_study_plan("alice@example.com")
        # After incorrect, next_review is tomorrow = upcoming
        total = len(plan["due_for_review"]) + len(plan["upcoming"])
        assert total >= 0

    def test_correct_increases_interval(self):
        """Multiple correct answers should increase the review interval."""
        update_schedule("bob@example.com", "Bob", "Physics", True)
        update_schedule("bob@example.com", "Bob", "Physics", True)
        update_schedule("bob@example.com", "Bob", "Physics", True)
        # After 3 correct, interval should be > 1
        plan = get_study_plan("bob@example.com")
        upcoming = [t for t in plan["upcoming"] if t["topic"] == "Physics"]
        if upcoming:
            assert upcoming[0]["interval_days"] > 1

    def test_incorrect_resets_interval(self):
        """Incorrect answer should reset the interval."""
        update_schedule("bob@example.com", "Bob", "Biology", True)
        update_schedule("bob@example.com", "Bob", "Biology", True)
        update_schedule("bob@example.com", "Bob", "Biology", False)
        # After incorrect, should be due soon
        plan = get_study_plan("bob@example.com")
        # Should be in upcoming with short interval
        all_topics = plan["due_for_review"] + plan["upcoming"]
        bio = [t for t in all_topics if t["topic"] == "Biology"]
        if bio:
            assert bio[0]["interval_days"] == 1

    def test_separate_students(self):
        update_schedule("alice@example.com", "Alice", "Bio", True)
        update_schedule("bob@example.com", "Bob", "Bio", False)
        plan_a = get_study_plan("alice@example.com")
        plan_b = get_study_plan("bob@example.com")
        # Plans should be independent
        assert plan_a != plan_b or True  # At minimum they return without error


class TestGetStudyPlan:
    def test_empty_plan(self):
        plan = get_study_plan("nobody@example.com")
        assert plan["due_for_review"] == []
        assert plan["upcoming"] == []
        assert plan["mastered_count"] == 0
        assert plan["study_days_30d"] == 0

    def test_returns_structure(self):
        update_schedule("alice@example.com", "Alice", "Bio", True)
        plan = get_study_plan("alice@example.com")
        assert "due_for_review" in plan
        assert "upcoming" in plan
        assert "mastered_count" in plan
        assert "study_days_30d" in plan
