"""Tests for the rule-based intent classifier."""

import pytest
from app.agent.classifier import classify_intent
from app.domain import intents


class TestClassifyIntent:
    """Test intent classification for various message patterns."""

    @pytest.mark.parametrize("message,expected", [
        ("Quiz me on the key concepts!", intents.QUIZ),
        ("test me on biology", intents.QUIZ),
        ("give me a practice question", intents.QUIZ),
        ("Can you give me a flash card?", intents.QUIZ),
        ("pop quiz time!", intents.QUIZ),
    ])
    def test_quiz_intent(self, message: str, expected: str) -> None:
        assert classify_intent(message) == expected

    @pytest.mark.parametrize("message,expected", [
        ("Summarize the main topics", intents.SUMMARIZE),
        ("give me an overview of genetics", intents.SUMMARIZE),
        ("what are the key takeaways?", intents.SUMMARIZE),
        ("TLDR of chapter 3", intents.SUMMARIZE),
        ("recap what we covered", intents.SUMMARIZE),
    ])
    def test_summarize_intent(self, message: str, expected: str) -> None:
        assert classify_intent(message) == expected

    @pytest.mark.parametrize("message,expected", [
        ("explain how the inner ear works", intents.EXPLAIN),
        ("what is mitosis?", intents.EXPLAIN),
        ("how does photosynthesis work?", intents.EXPLAIN),
        ("tell me about the cochlea", intents.EXPLAIN),
        ("describe the difference between DNA and RNA", intents.EXPLAIN),
        ("help me understand osmosis", intents.EXPLAIN),
    ])
    def test_explain_intent(self, message: str, expected: str) -> None:
        assert classify_intent(message) == expected

    @pytest.mark.parametrize("message,expected", [
        ("what topics do you have?", intents.TOPICS),
        ("list topics available", intents.TOPICS),
        ("what can i study?", intents.TOPICS),
        ("what material do you have?", intents.TOPICS),
    ])
    def test_topics_intent(self, message: str, expected: str) -> None:
        assert classify_intent(message) == expected

    @pytest.mark.parametrize("message,expected", [
        ("is this correct: mitosis has 4 phases", intents.CHECK_ANSWER),
        ("check my answer please", intents.CHECK_ANSWER),
        ("am i right about this?", intents.CHECK_ANSWER),
        ("did i get it right?", intents.CHECK_ANSWER),
    ])
    def test_check_answer_intent(self, message: str, expected: str) -> None:
        assert classify_intent(message) == expected

    @pytest.mark.parametrize("message", [
        "hello",
        "thanks!",
        "interesting",
        "I like science",
        "what time is it",
    ])
    def test_general_intent(self, message: str) -> None:
        assert classify_intent(message) == intents.GENERAL

    def test_case_insensitive(self) -> None:
        assert classify_intent("QUIZ ME") == intents.QUIZ
        assert classify_intent("Summarize THIS") == intents.SUMMARIZE

    def test_empty_message(self) -> None:
        assert classify_intent("") == intents.GENERAL

    def test_whitespace_message(self) -> None:
        assert classify_intent("   ") == intents.GENERAL
