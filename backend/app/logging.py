"""Structured logging configuration."""

import logging
import sys


def setup_logging(level: str = "INFO") -> None:
    """Configure structured logging for the application."""
    fmt = "%(asctime)s %(levelname)-8s [%(name)s] %(message)s"
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format=fmt,
        stream=sys.stdout,
    )
    # Quiet noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Get a named logger."""
    return logging.getLogger(name)
