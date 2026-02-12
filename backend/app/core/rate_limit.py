"""Simple in-memory rate limiter per student for Gemini API protection."""

import threading
import time
from collections import defaultdict

# {student_id: [(timestamp, ...), ...]}
_requests: dict[str, list[float]] = defaultdict(list)
_lock = threading.Lock()

# Defaults: 100 requests per student per day (protects the 1000 req/day Gemini quota)
DEFAULT_MAX_PER_DAY = 100
_WINDOW = 86400  # 24 hours in seconds


def check_rate_limit(student_id: str, max_per_day: int = DEFAULT_MAX_PER_DAY) -> None:
    """
    Check if a student has exceeded the daily request limit.

    Raises AppError(429) if limit exceeded.
    """
    from app.core.errors import AppError

    now = time.time()
    cutoff = now - _WINDOW

    with _lock:
        # Prune old entries
        timestamps = _requests[student_id]
        _requests[student_id] = [t for t in timestamps if t > cutoff]

        if len(_requests[student_id]) >= max_per_day:
            raise AppError(
                f"Daily limit reached ({max_per_day} requests/day). Try again tomorrow.",
                status_code=429,
            )

        _requests[student_id].append(now)


def reset_limits() -> None:
    """Clear all rate limit data (useful for testing)."""
    _requests.clear()
