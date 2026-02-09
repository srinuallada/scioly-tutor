"""
Rule-based intent classifier.
Fast, free, no LLM call — pattern matching on keywords.
"""


INTENT_PATTERNS: dict[str, list[str]] = {
    "quiz": [
        "quiz me", "test me", "practice question", "flash card", "flashcard",
        "give me a question", "assessment", "review question", "quiz",
        "test my knowledge", "pop quiz",
    ],
    "summarize": [
        "summarize", "summary", "overview", "main points", "key takeaway",
        "what are the main", "tldr", "tl;dr", "recap", "highlights",
        "key concepts", "big picture",
    ],
    "explain": [
        "explain", "what is", "what are", "how does", "how do",
        "why does", "why do", "tell me about", "describe",
        "difference between", "compare", "define", "meaning of",
        "help me understand", "break down", "walk me through",
    ],
    "topics": [
        "what topics", "what material", "what do you have",
        "list topics", "available topics", "what can i study",
        "show me topics", "what subjects",
    ],
    "check_answer": [
        "is this correct", "check my answer", "am i right",
        "is this right", "grade my", "did i get", "is that correct",
        "evaluate my answer",
    ],
}


def classify_intent(message: str) -> str:
    """
    Classify the user's intent from their message.

    Returns one of: quiz, summarize, explain, topics, check_answer, general
    """
    msg = message.lower().strip()

    for intent, patterns in INTENT_PATTERNS.items():
        if any(pattern in msg for pattern in patterns):
            return intent

    return "general"
