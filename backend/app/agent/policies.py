"""
Security policies for the agent pipeline.

Documents are untrusted user content — defend against prompt injection
and other adversarial inputs in uploaded materials.
"""

import re

# Patterns that indicate prompt injection attempts in uploaded materials
_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"ignore\s+(all\s+)?above\s+instructions",
    r"you\s+are\s+now\s+a",
    r"new\s+system\s+prompt",
    r"override\s+(system|safety)",
    r"disregard\s+(all|your|the)\s+(rules|instructions|guidelines)",
    r"forget\s+(everything|all|your)\s+(above|previous|rules)",
    r"act\s+as\s+(if|though)\s+you",
    r"pretend\s+(you\s+are|to\s+be)",
    r"jailbreak",
    r"DAN\s+mode",
]

_INJECTION_RE = re.compile("|".join(_INJECTION_PATTERNS), re.IGNORECASE)


def sanitize_search_context(context: str, max_length: int = 8000) -> str:
    """
    Sanitize search context before injecting into the LLM prompt.

    - Truncate to max_length to prevent context stuffing
    - Strip potential prompt injection markers from uploaded materials
    """
    if len(context) > max_length:
        context = context[:max_length] + "\n[... truncated]"

    # Neutralize prompt injection attempts in study materials
    context = _INJECTION_RE.sub("[content filtered]", context)

    return context


def sanitize_user_message(message: str, max_length: int = 2000) -> str:
    """Sanitize user message — length limit and basic content check."""
    return message[:max_length].strip()
