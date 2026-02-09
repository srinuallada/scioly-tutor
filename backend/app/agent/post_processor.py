"""
Post-processor — parses LLM responses and extracts structured data (e.g. quiz).
"""

import re


def format_response(response_text: str, intent: str) -> dict:
    """
    Parse LLM response and extract structured data.

    Returns:
        {
            "text": str,
            "quiz_data": dict | None
        }
    """
    result: dict = {"text": response_text.strip(), "quiz_data": None}

    if intent == "quiz":
        result["quiz_data"] = _extract_quiz_data(response_text)

    return result


def _extract_quiz_data(text: str) -> dict | None:
    """Try to extract question, options, and answer from quiz response."""
    try:
        options: list[str] = []
        for letter in ("A", "B", "C", "D"):
            pattern = rf"(?:^|\n)\s*{letter}[).:\s]+(.+)"
            match = re.search(pattern, text, re.MULTILINE)
            if match:
                options.append(match.group(1).strip())

        answer_match = re.search(
            r"(?:correct answer|answer)[:\s]*([A-D])", text, re.IGNORECASE
        )

        if options and answer_match:
            return {
                "options": options,
                "correct_letter": answer_match.group(1).upper(),
            }
    except Exception:
        pass

    return None
