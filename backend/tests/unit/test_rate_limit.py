"""Tests for the rate limiter."""

import pytest
from app.core.rate_limit import check_rate_limit, reset_limits
from app.core.errors import AppError


@pytest.fixture(autouse=True)
def clean_limits():
    """Reset rate limits between tests."""
    reset_limits()
    yield
    reset_limits()


class TestRateLimit:
    def test_allows_under_limit(self) -> None:
        # Should not raise
        for _ in range(5):
            check_rate_limit("student1", max_per_day=10)

    def test_blocks_over_limit(self) -> None:
        for _ in range(5):
            check_rate_limit("student1", max_per_day=5)

        with pytest.raises(AppError) as exc_info:
            check_rate_limit("student1", max_per_day=5)
        assert exc_info.value.status_code == 429

    def test_separate_students(self) -> None:
        for _ in range(5):
            check_rate_limit("student1", max_per_day=5)

        # student2 should still be allowed
        check_rate_limit("student2", max_per_day=5)

    def test_reset_clears_limits(self) -> None:
        for _ in range(5):
            check_rate_limit("student1", max_per_day=5)

        reset_limits()
        # Should work again
        check_rate_limit("student1", max_per_day=5)

    def test_error_message(self) -> None:
        for _ in range(3):
            check_rate_limit("student1", max_per_day=3)

        with pytest.raises(AppError, match="Daily limit reached"):
            check_rate_limit("student1", max_per_day=3)
