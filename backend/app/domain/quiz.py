"""Domain types for quiz tracking."""

from dataclasses import dataclass


@dataclass
class AnswerResult:
    is_correct: bool
    correct_answer: str
