"""Tests for the post-processor (LLM response parsing and quiz extraction)."""

import pytest
from app.agent.post_processor import format_response


class TestFormatResponse:
    def test_non_quiz_returns_text_only(self) -> None:
        result = format_response("Hello, the answer is X.", "explain")
        assert result["text"] == "Hello, the answer is X."
        assert result["quiz_data"] is None

    def test_strips_whitespace(self) -> None:
        result = format_response("  trimmed  ", "general")
        assert result["text"] == "trimmed"

    def test_quiz_extracts_data(self) -> None:
        quiz_text = """Here's a question about biology:

What is the powerhouse of the cell?

A) Nucleus
B) Mitochondria
C) Ribosome
D) Golgi apparatus

Correct answer: B
"""
        result = format_response(quiz_text, "quiz")
        assert result["quiz_data"] is not None
        assert len(result["quiz_data"]["options"]) == 4
        assert result["quiz_data"]["correct_letter"] == "B"
        assert "Mitochondria" in result["quiz_data"]["options"][1]

    def test_quiz_with_dot_format(self) -> None:
        quiz_text = """Which bone is the longest?

A. Femur
B. Tibia
C. Humerus
D. Fibula

The answer is A
"""
        result = format_response(quiz_text, "quiz")
        assert result["quiz_data"] is not None
        assert result["quiz_data"]["correct_letter"] == "A"
        assert "Femur" in result["quiz_data"]["options"][0]

    def test_quiz_with_colon_format(self) -> None:
        quiz_text = """What carries blood away from the heart?

A: Veins
B: Arteries
C: Capillaries
D: Lymph nodes

Correct Answer: B
"""
        result = format_response(quiz_text, "quiz")
        assert result["quiz_data"] is not None
        assert result["quiz_data"]["correct_letter"] == "B"

    def test_quiz_no_options_returns_none(self) -> None:
        result = format_response("Just a general quiz response with no options.", "quiz")
        assert result["quiz_data"] is None

    def test_quiz_no_answer_returns_none(self) -> None:
        text = """Question here?

A) Option 1
B) Option 2
C) Option 3
D) Option 4

No explicit answer marker here.
"""
        result = format_response(text, "quiz")
        assert result["quiz_data"] is None

    def test_non_quiz_intent_ignores_quiz_data(self) -> None:
        quiz_like = """A) First
B) Second
C) Third
D) Fourth
Answer: A"""
        result = format_response(quiz_like, "explain")
        assert result["quiz_data"] is None
