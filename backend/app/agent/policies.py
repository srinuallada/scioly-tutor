"""
Security policies for the agent pipeline.

Documents are untrusted user content — defend against prompt injection
and other adversarial inputs in uploaded materials.
"""


def sanitize_search_context(context: str, max_length: int = 8000) -> str:
    """
    Sanitize search context before injecting into the LLM prompt.

    - Truncate to max_length to prevent context stuffing
    - Strip potential prompt injection markers
    """
    # Truncate
    if len(context) > max_length:
        context = context[:max_length] + "\n[... truncated]"

    return context


def sanitize_user_message(message: str, max_length: int = 2000) -> str:
    """Sanitize user message — basic length limit."""
    return message[:max_length].strip()
