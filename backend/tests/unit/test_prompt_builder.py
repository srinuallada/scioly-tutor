"""Tests for the prompt builder."""

import pytest
from app.agent.prompt_builder import build_prompt, build_messages
from app.domain import intents


class TestBuildPrompt:
    def test_contains_system_prompt(self) -> None:
        result = build_prompt(intents.GENERAL, "some context")
        assert "Science Olympiad tutor" in result

    def test_contains_intent_instruction(self) -> None:
        result = build_prompt(intents.QUIZ, "some context")
        assert "practice quiz question" in result

    def test_contains_search_context(self) -> None:
        result = build_prompt(intents.GENERAL, "The cochlea is in the inner ear")
        assert "cochlea" in result
        assert "<study_materials>" in result
        assert "</study_materials>" in result

    def test_includes_student_name(self) -> None:
        result = build_prompt(intents.GENERAL, "ctx", student_name="alex")
        assert "alex" in result

    def test_default_student_not_mentioned(self) -> None:
        result = build_prompt(intents.GENERAL, "ctx", student_name="default")
        assert "student's name" not in result

    def test_includes_weak_areas(self) -> None:
        result = build_prompt(intents.GENERAL, "ctx", weak_areas=["Genetics", "Anatomy"])
        assert "Genetics" in result
        assert "Anatomy" in result
        assert "weak areas" in result.lower()

    def test_no_weak_areas(self) -> None:
        result = build_prompt(intents.GENERAL, "ctx")
        assert "weak areas" not in result.lower()

    def test_all_intents_have_instructions(self) -> None:
        for intent in [intents.QUIZ, intents.SUMMARIZE, intents.EXPLAIN,
                       intents.CHECK_ANSWER, intents.GENERAL]:
            result = build_prompt(intent, "ctx")
            assert "## Your Task" in result

    def test_unknown_intent_falls_back_to_general(self) -> None:
        result = build_prompt("unknown_intent", "ctx")
        assert "## Your Task" in result


class TestBuildMessages:
    def test_basic_message(self) -> None:
        msgs = build_messages("hello", [])
        assert len(msgs) == 1
        assert msgs[0]["role"] == "user"
        assert msgs[0]["content"] == "hello"

    def test_with_history(self) -> None:
        history = [
            {"role": "user", "content": "hi"},
            {"role": "assistant", "content": "hello!"},
        ]
        msgs = build_messages("next question", history)
        assert len(msgs) == 3
        assert msgs[0]["role"] == "user"
        assert msgs[0]["content"] == "hi"
        assert msgs[-1]["content"] == "next question"

    def test_max_history_truncation(self) -> None:
        history = [{"role": "user", "content": f"msg {i}"} for i in range(20)]
        msgs = build_messages("latest", history, max_history=5)
        # 5 history + 1 current = 6
        assert len(msgs) == 6

    def test_filters_invalid_roles(self) -> None:
        history = [
            {"role": "user", "content": "valid"},
            {"role": "system", "content": "invalid"},
            {"role": "assistant", "content": "valid"},
        ]
        msgs = build_messages("hello", history)
        assert len(msgs) == 3  # 2 valid history + 1 current

    def test_filters_empty_content(self) -> None:
        history = [
            {"role": "user", "content": ""},
            {"role": "user", "content": "valid"},
        ]
        msgs = build_messages("hello", history)
        assert len(msgs) == 2  # 1 valid history + 1 current
