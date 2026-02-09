"""Typed request/response models for the LLM layer (internal use)."""

from dataclasses import dataclass


@dataclass
class LLMMessage:
    role: str  # "user" | "assistant"
    content: str


@dataclass
class LLMRequest:
    messages: list[LLMMessage]
    system_prompt: str
    model: str
    max_tokens: int = 2048
    temperature: float = 0.7


@dataclass
class LLMResponse:
    text: str
    model: str
    finish_reason: str = "stop"
