"""
Google Gemini API client.
Uses the free tier (1,000 requests/day, no credit card needed).

Get your key at: https://aistudio.google.com/apikey
"""

import os
from google import genai
from google.genai import types


_client: genai.Client | None = None


def _get_client() -> genai.Client:
    """Get or create the Gemini client (singleton)."""
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key or api_key == "your_api_key_here":
            raise ValueError(
                "GEMINI_API_KEY not set. "
                "Get a free key at https://aistudio.google.com/apikey "
                "and add it to backend/.env"
            )
        _client = genai.Client(api_key=api_key)
    return _client


async def chat(
    messages: list[dict],
    system_prompt: str,
    model: str | None = None,
    max_tokens: int = 2048,
    temperature: float = 0.7,
) -> str:
    """
    Send a chat request to Gemini and return the response text.

    Args:
        messages: List of {"role": "user"|"assistant", "content": "..."} dicts
        system_prompt: System instruction for the model
        model: Model name (defaults to GEMINI_MODEL env var or gemini-2.5-flash)
        max_tokens: Maximum response tokens
        temperature: Creativity level (0.0 - 1.0)

    Returns:
        The model's response text
    """
    client = _get_client()
    model_name = model or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # Convert messages to Gemini format
    contents = []
    for msg in messages:
        role = "user" if msg["role"] == "user" else "model"
        contents.append(
            types.Content(
                role=role,
                parts=[types.Part(text=msg["content"])],
            )
        )

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                max_output_tokens=max_tokens,
                temperature=temperature,
            ),
        )
        return response.text or "I had trouble generating a response. Could you try rephrasing?"

    except Exception as e:
        error_msg = str(e)
        if "quota" in error_msg.lower() or "429" in error_msg:
            return (
                "⚠️ Hit the daily API limit. The free tier allows 1,000 requests/day. "
                "Try again tomorrow, or consider upgrading to the paid tier for ~$0.01/session."
            )
        if "api_key" in error_msg.lower() or "401" in error_msg:
            return (
                "⚠️ Invalid API key. Please check your GEMINI_API_KEY in backend/.env. "
                "Get a free key at https://aistudio.google.com/apikey"
            )
        return f"⚠️ Error from Gemini: {error_msg}"
