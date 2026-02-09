"""Optional metrics hooks — request timing, LLM call counting."""

import time
from functools import wraps
from app.logging import get_logger

log = get_logger(__name__)

# Simple in-memory counters (replace with Prometheus/StatsD in production)
_counters: dict[str, int] = {}
_timings: dict[str, list[float]] = {}


def count(metric: str) -> None:
    """Increment a counter."""
    _counters[metric] = _counters.get(metric, 0) + 1


def timed(label: str):
    """Decorator to time a function and log the duration."""
    def decorator(fn):
        @wraps(fn)
        async def wrapper(*args, **kwargs):
            start = time.perf_counter()
            result = await fn(*args, **kwargs)
            elapsed = (time.perf_counter() - start) * 1000
            _timings.setdefault(label, []).append(elapsed)
            log.debug("%s completed in %.1fms", label, elapsed)
            return result
        return wrapper
    return decorator


def get_metrics() -> dict:
    """Return current metrics snapshot."""
    return {
        "counters": dict(_counters),
        "timings": {k: {"count": len(v), "avg_ms": sum(v) / len(v)} for k, v in _timings.items() if v},
    }
