"""
Prompt builder — assembles the system prompt, intent instructions,
retrieved material context, and conversation history into a single
prompt for the LLM.
"""

from app.domain import intents

TUTOR_SYSTEM_PROMPT = """You are an enthusiastic, patient Science Olympiad tutor helping a high school student prepare for competition.

Your style:
- Clear, age-appropriate explanations
- Use analogies and real-world examples to make concepts memorable
- Break down complex topics into digestible steps
- Mention how concepts might appear in competition questions when relevant
- Be encouraging — science is exciting!
- When you reference material, mention which source it came from
- Keep answers focused and concise (competition prep = efficiency)
- Use bold for key terms that the student should remember

CRITICAL — Diagrams and figures:
- The study materials contain markdown image tags like ![description](/api/images/filename.png)
- These are NOT requests to generate images. They are text references to existing files already stored on the server.
- When a study material chunk contains a ![...](...) tag, you MUST copy that exact markdown text into your response verbatim.
- Do NOT say "I cannot display images" — you are outputting markdown text, not generating images. The frontend renders the markdown.
- Do NOT describe what the image shows instead of including it. Include the markdown tag AND your explanation.
- Example: if the source has ![Circuit](/api/images/circuit.png), your response should include the text ![Circuit](/api/images/circuit.png) exactly as-is."""


INTENT_INSTRUCTIONS: dict[str, str] = {
    intents.QUIZ: (
        "Generate a practice quiz question based on the study materials below. "
        "Include: the question, 4 multiple choice options (A-D), and the correct "
        "answer with a brief explanation. Make it competition-level difficulty. "
        "Format clearly with the question first, then options, then the answer."
    ),
    intents.SUMMARIZE: (
        "Provide a clear, organized summary of the key points from these materials. "
        "Highlight the most important concepts a student should remember for competition. "
        "Use bold for key terms."
    ),
    intents.EXPLAIN: (
        "Explain the concept clearly using the study materials as your source. "
        "Use an analogy or real-world example to make it stick. "
        "If the materials don't fully cover the topic, supplement with your knowledge "
        "but note what comes from the materials vs general knowledge."
    ),
    intents.CHECK_ANSWER: (
        "Evaluate the student's answer based on the study materials. "
        "Tell them if they're correct, partially correct, or incorrect. "
        "Provide the accurate information from the materials and explain why."
    ),
    intents.GENERAL: (
        "Answer the student's question using the study materials when relevant. "
        "If the question goes beyond the materials, answer from general knowledge "
        "but mention that it's not from their study materials."
    ),
}


def build_prompt(
    intent: str,
    search_context: str,
    student_name: str = "default",
    weak_areas: list[str] | None = None,
) -> str:
    """
    Build the system prompt for the LLM call.

    Combines: base tutor prompt + intent instruction + search context + student context.
    """
    parts = [TUTOR_SYSTEM_PROMPT]

    instruction = INTENT_INSTRUCTIONS.get(intent, INTENT_INSTRUCTIONS[intents.GENERAL])
    parts.append(f"\n## Your Task\n{instruction}")

    if student_name != "default":
        parts.append(f"\nThe student's name is {student_name}.")
    if weak_areas:
        areas = ", ".join(weak_areas)
        parts.append(
            f"Their weak areas are: {areas}. "
            "Pay extra attention if the question relates to these topics."
        )

    parts.append(
        f"\n## Study Materials\n<study_materials>\n{search_context}\n</study_materials>"
    )

    return "\n".join(parts)


def _estimate_tokens(text: str) -> int:
    """Estimate token count (~4 chars per token for English text)."""
    return len(text) // 4


def build_messages(
    user_message: str,
    conversation_history: list[dict],
    max_history: int = 10,
    max_context_tokens: int = 4000,
) -> list[dict]:
    """
    Build the messages array for the LLM call.

    Includes recent conversation history for multi-turn context,
    with smart truncation to stay within a token budget.
    Keeps the first user message for context grounding and prioritizes
    the most recent messages.
    """
    valid_history = [
        msg for msg in (conversation_history or [])
        if msg.get("role") in ("user", "assistant") and msg.get("content")
    ]

    # Reserve tokens for the current user message
    current_tokens = _estimate_tokens(user_message)
    remaining = max_context_tokens - current_tokens

    if remaining <= 0 or not valid_history:
        return [{"role": "user", "content": user_message}]

    # Take at most max_history messages
    candidates = valid_history[-max_history:]

    # Build from newest to oldest, respecting token budget
    selected: list[dict] = []
    used_tokens = 0
    for msg in reversed(candidates):
        msg_tokens = _estimate_tokens(msg["content"])
        if used_tokens + msg_tokens > remaining:
            break
        selected.append({"role": msg["role"], "content": msg["content"]})
        used_tokens += msg_tokens

    # If we have room and the first message in history was cut off, include it
    if selected and valid_history and len(selected) < len(candidates):
        first_msg = candidates[0]
        first_tokens = _estimate_tokens(first_msg["content"])
        if used_tokens + first_tokens <= remaining:
            if first_msg["content"] != selected[-1]["content"]:
                selected.append({"role": first_msg["role"], "content": first_msg["content"]})

    # Reverse back to chronological order
    selected.reverse()

    selected.append({"role": "user", "content": user_message})
    return selected
