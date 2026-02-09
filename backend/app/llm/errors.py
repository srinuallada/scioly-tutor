"""LLM-specific error types."""

from app.core.errors import LLMError


class QuotaExceededError(LLMError):
    def __init__(self):
        super().__init__(
            "Hit the daily API limit. The free tier allows 1,000 requests/day. "
            "Try again tomorrow."
        )


class InvalidKeyError(LLMError):
    def __init__(self):
        super().__init__(
            "Invalid API key. Check your GEMINI_API_KEY in .env. "
            "Get a free key at https://aistudio.google.com/apikey"
        )
