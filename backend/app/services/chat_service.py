"""
Chat service — the full agent pipeline:
classify → search → prompt → LLM → postprocess
"""

from app.agent.classifier import classify_intent
from app.agent.prompt_builder import build_prompt, build_messages
from app.agent.post_processor import format_response
from app.agent.policies import sanitize_user_message, sanitize_search_context
from app.core.rate_limit import check_rate_limit
from app.retrieval.search import StudySearch
from app.llm.gemini_client import chat as gemini_chat
from app.storage.chat_repo import save_chat_message
from app.storage.progress_repo import get_weak_areas
from app.domain import intents


async def handle_chat(
    message: str,
    student_name: str,
    conversation_history: list[dict],
    search_engine: StudySearch,
) -> dict:
    """
    Run the full chat pipeline and return the response dict.

    Returns dict with: response, intent, sources_used, topics_referenced, quiz_data
    """
    # 0. Sanitize user input & check rate limit
    message = sanitize_user_message(message)
    check_rate_limit(student_name)

    # 1. Classify intent (free, instant)
    intent = classify_intent(message)

    # 2. Handle topic listing without LLM
    if intent == intents.TOPICS:
        return _handle_topics(search_engine)

    # 3. Search for relevant material
    search_context = sanitize_search_context(search_engine.search_formatted(message, top_k=5))
    search_results = search_engine.search(message, top_k=5)
    topics_found = list(set(r["section_title"] for r in search_results))

    # 4. Build prompt
    weak_areas = get_weak_areas(student_name)
    system_prompt = build_prompt(
        intent=intent,
        search_context=search_context,
        student_name=student_name,
        weak_areas=weak_areas,
    )
    messages = build_messages(
        user_message=message,
        conversation_history=conversation_history,
    )

    # 5. Call Gemini
    response_text = await gemini_chat(messages=messages, system_prompt=system_prompt)

    # 6. Post-process
    processed = format_response(response_text, intent)

    # 7. Save to chat history
    save_chat_message(student_name, "user", message, intent)
    save_chat_message(student_name, "assistant", processed["text"], intent)

    return {
        "response": processed["text"],
        "intent": intent,
        "sources_used": len(search_results),
        "topics_referenced": topics_found,
        "quiz_data": processed.get("quiz_data"),
    }


def _handle_topics(search_engine: StudySearch) -> dict:
    """Handle topic-listing intent without LLM call."""
    topics = search_engine.get_all_topics()
    stats = search_engine.get_stats()

    if not topics:
        text = "No study materials loaded yet. Upload some files in the Materials tab!"
    else:
        topic_list = "\n".join(f"- {t}" for t in topics[:40])
        text = (
            f"**{stats['total_files']} files** loaded with "
            f"**{stats['total_chunks']} sections** ({stats['total_words']:,} words)\n\n"
            f"**Topics:**\n{topic_list}"
        )

    return {
        "response": text,
        "intent": intents.TOPICS,
        "sources_used": 0,
        "topics_referenced": [],
        "quiz_data": None,
    }
