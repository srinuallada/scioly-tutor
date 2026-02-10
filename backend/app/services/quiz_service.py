"""Quiz service — grade answers, record results, and generate quizzes."""

import json
import logging

from app.storage.progress_repo import save_quiz_result
from app.storage.schedule_repo import update_schedule

log = logging.getLogger(__name__)

QUIZ_GENERATION_PROMPT = """Generate exactly ONE multiple-choice quiz question about the topic: {topic}

Use ONLY the study materials below to create the question. Make it competition-level difficulty appropriate for Science Olympiad.

{context}

Respond in EXACTLY this JSON format (no markdown, no extra text):
{{"question": "Your question here?", "options": ["option A text", "option B text", "option C text", "option D text"], "correct_letter": "A", "explanation": "Brief explanation of the correct answer."}}"""


def submit_answer(
    student_id: str,
    student_name: str,
    topic: str,
    question: str,
    student_answer: str,
    correct_answer: str,
) -> dict:
    """Grade a quiz answer and persist the result."""
    is_correct = student_answer.strip().lower() == correct_answer.strip().lower()

    save_quiz_result(
        student_id=student_id,
        student_name=student_name,
        topic=topic,
        question=question,
        student_answer=student_answer,
        correct_answer=correct_answer,
        is_correct=is_correct,
    )

    # Update spaced repetition schedule
    update_schedule(student_id, student_name, topic, is_correct)

    return {"is_correct": is_correct, "correct_answer": correct_answer}


async def generate_quiz(topic: str, search_engine) -> dict:
    """Generate a quiz question for the given topic using Gemini."""
    from app.llm.gemini_client import chat as gemini_chat

    # Search for relevant context
    context = search_engine.search_formatted(topic, top_k=5)

    prompt = QUIZ_GENERATION_PROMPT.format(topic=topic, context=context)
    messages = [{"role": "user", "content": prompt}]

    system_prompt = (
        "You are a quiz question generator for Science Olympiad competition prep. "
        "Always respond with valid JSON only, no markdown formatting."
    )

    response_text = await gemini_chat(
        messages=messages,
        system_prompt=system_prompt,
        temperature=0.8,
    )

    # Parse the JSON response
    try:
        # Strip markdown code fences if present
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            cleaned = cleaned.rsplit("```", 1)[0]
        data = json.loads(cleaned.strip())

        return {
            "question": data["question"],
            "options": data["options"][:4],
            "correct_letter": data.get("correct_letter", "A"),
            "explanation": data.get("explanation", ""),
            "topic": topic,
        }
    except (json.JSONDecodeError, KeyError) as e:
        log.warning("Failed to parse quiz JSON: %s", e)
        return {
            "question": "Sorry, I couldn't generate a quiz question. Try again.",
            "options": [],
            "correct_letter": "",
            "explanation": "",
            "topic": topic,
        }
