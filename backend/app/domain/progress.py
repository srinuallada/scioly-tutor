"""Domain types for progress analytics."""

from dataclasses import dataclass


@dataclass
class TopicScore:
    topic: str
    total: int
    correct: int
    accuracy: float
