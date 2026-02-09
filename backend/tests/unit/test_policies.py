"""Tests for security policies (sanitization functions)."""

import pytest
from app.agent.policies import sanitize_user_message, sanitize_search_context


class TestSanitizeUserMessage:
    def test_normal_message(self) -> None:
        assert sanitize_user_message("explain mitosis") == "explain mitosis"

    def test_strips_whitespace(self) -> None:
        assert sanitize_user_message("  hello  ") == "hello"

    def test_truncates_long_message(self) -> None:
        long_msg = "a" * 3000
        result = sanitize_user_message(long_msg)
        assert len(result) == 2000

    def test_custom_max_length(self) -> None:
        result = sanitize_user_message("hello world", max_length=5)
        assert result == "hello"

    def test_empty_message(self) -> None:
        assert sanitize_user_message("") == ""

    def test_exact_max_length(self) -> None:
        msg = "a" * 2000
        assert sanitize_user_message(msg) == msg


class TestSanitizeSearchContext:
    def test_normal_context(self) -> None:
        ctx = "The cochlea is part of the inner ear."
        assert sanitize_search_context(ctx) == ctx

    def test_truncates_long_context(self) -> None:
        long_ctx = "word " * 5000  # ~25000 chars
        result = sanitize_search_context(long_ctx)
        assert len(result) <= 8000 + len("\n[... truncated]")
        assert result.endswith("[... truncated]")

    def test_custom_max_length(self) -> None:
        ctx = "a" * 200
        result = sanitize_search_context(ctx, max_length=100)
        assert len(result) <= 100 + len("\n[... truncated]")

    def test_empty_context(self) -> None:
        assert sanitize_search_context("") == ""

    def test_exact_max_length(self) -> None:
        ctx = "a" * 8000
        result = sanitize_search_context(ctx)
        assert result == ctx  # should not truncate at exactly max
