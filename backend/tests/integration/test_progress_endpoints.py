"""Integration tests for progress and study plan endpoints."""

import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("SCIOLY_TEST_MODE", "1")

from app.main import app
from app.core.auth import require_auth
from app.storage.db import init_db


@pytest.fixture()
def client(tmp_path, monkeypatch):
    db_path = str(tmp_path / "test.db")
    monkeypatch.setattr("app.settings.DB_PATH", db_path)
    monkeypatch.setattr("app.storage.db.DB_PATH", db_path)
    init_db()

    app.dependency_overrides[require_auth] = lambda: {"email": "alice@example.com"}
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_progress_and_study_plan_are_keyed_by_email(client):
    submit = client.post(
        "/api/quiz/submit",
        json={
            "question": "What is 2+2?",
            "student_answer": "A",
            "correct_answer": "A",
            "topic": "Math",
            "student_name": "Alice",
        },
    )
    assert submit.status_code == 200
    assert submit.json()["is_correct"] is True

    progress = client.get("/api/progress")
    assert progress.status_code == 200
    progress_json = progress.json()
    assert progress_json["student_id"] == "alice@example.com"
    assert progress_json["overall"]["total_questions"] == 1

    plan = client.get("/api/study-plan")
    assert plan.status_code == 200
    plan_json = plan.json()
    assert "due_for_review" in plan_json
    assert "upcoming" in plan_json

    # Switch auth to a different user and ensure isolation
    app.dependency_overrides[require_auth] = lambda: {"email": "bob@example.com"}
    progress_b = client.get("/api/progress")
    assert progress_b.status_code == 200
    assert progress_b.json()["overall"]["total_questions"] == 0
