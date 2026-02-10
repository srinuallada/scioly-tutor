"""Tests for context window management in prompt builder."""

import pytest

from app.agent.prompt_builder import build_messages, _estimate_tokens


class TestEstimateTokens:
    def test_empty_string(self):
        assert _estimate_tokens("") == 0

    def test_short_text(self):
        # "hello" = 5 chars → ~1 token
        assert _estimate_tokens("hello") == 1

    def test_longer_text(self):
        text = "a" * 400
        assert _estimate_tokens(text) == 100


class TestBuildMessagesContextWindow:
    def test_basic_message_no_history(self):
        msgs = build_messages("hello", [])
        assert len(msgs) == 1
        assert msgs[0]["content"] == "hello"

    def test_includes_recent_history(self):
        history = [
            {"role": "user", "content": "first question"},
            {"role": "assistant", "content": "first answer"},
            {"role": "user", "content": "second question"},
            {"role": "assistant", "content": "second answer"},
        ]
        msgs = build_messages("third question", history)
        assert len(msgs) == 5  # 4 history + current
        assert msgs[-1]["content"] == "third question"

    def test_truncates_when_over_budget(self):
        # Create history that exceeds the token budget
        long_msg = "x" * 4000  # ~1000 tokens
        history = [
            {"role": "user", "content": long_msg},
            {"role": "assistant", "content": long_msg},
            {"role": "user", "content": "recent question"},
            {"role": "assistant", "content": "recent answer"},
        ]
        msgs = build_messages("current", history, max_context_tokens=2000)
        # Should include recent messages but not all long ones
        assert msgs[-1]["content"] == "current"
        # Should have fewer than all history messages
        assert len(msgs) < 5

    def test_keeps_current_message_always(self):
        # Even with very small budget, current message should be included
        msgs = build_messages("hi", [{"role": "user", "content": "x" * 40000}], max_context_tokens=100)
        assert len(msgs) >= 1
        assert msgs[-1]["content"] == "hi"

    def test_preserves_chronological_order(self):
        history = [
            {"role": "user", "content": "first"},
            {"role": "assistant", "content": "second"},
            {"role": "user", "content": "third"},
        ]
        msgs = build_messages("fourth", history)
        contents = [m["content"] for m in msgs]
        assert contents == ["first", "second", "third", "fourth"]

    def test_filters_invalid_roles(self):
        history = [
            {"role": "system", "content": "ignored"},
            {"role": "user", "content": "kept"},
        ]
        msgs = build_messages("hello", history)
        assert len(msgs) == 2  # only user + current

    def test_filters_empty_content(self):
        history = [
            {"role": "user", "content": ""},
            {"role": "user", "content": "valid"},
        ]
        msgs = build_messages("hello", history)
        assert len(msgs) == 2  # only valid + current

    def test_max_history_limit(self):
        history = [{"role": "user", "content": f"msg{i}"} for i in range(20)]
        msgs = build_messages("current", history, max_history=5)
        # max 5 history + 1 current = at most 6
        assert len(msgs) <= 6
