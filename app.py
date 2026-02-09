"""
SciOly Tutor — FastAPI Backend

Start: uvicorn app:app --reload --port 8000
Docs:  http://localhost:8000/docs
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent.classifier import classify_intent
from agent.prompt_builder import build_prompt, build_messages
from agent.post_processor import format_response
from retrieval.processor import process_file, save_chunks, load_chunks
from retrieval.search import StudySearch
from llm.gemini_client import chat as gemini_chat
from storage.progress import (
    init_db, save_chat_message, save_quiz_result, get_progress, get_weak_areas,
)

# ──────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────

load_dotenv()

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
CHUNKS_PATH = os.path.join(DATA_DIR, "chunks.json")

# Global search engine instance
search_engine = StudySearch()


def reload_search_index() -> None:
    """Rebuild the search index from chunks file."""
    if os.path.exists(CHUNKS_PATH):
        search_engine.load_chunks(CHUNKS_PATH)
    else:
        print("⚠️  No chunks.json found. Upload materials to get started.")


# ──────────────────────────────────────────────
# App Lifecycle
# ──────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB, create dirs, load search index."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    init_db()
    reload_search_index()
    yield


app = FastAPI(
    title="SciOly Tutor API",
    description="Free, local Science Olympiad study agent",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Request/Response Models
# ──────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    student_name: str = "default"
    conversation_history: list[dict] = []


class ChatResponse(BaseModel):
    response: str
    intent: str
    sources_used: int
    topics_referenced: list[str] = []
    quiz_data: dict | None = None


class QuizSubmission(BaseModel):
    question: str
    student_answer: str
    correct_answer: str
    topic: str
    student_name: str = "default"


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint — the full agent pipeline:
    1. Classify intent (free, instant)
    2. Search materials (free, instant)
    3. Build prompt with context
    4. Call Gemini (1 API call)
    5. Post-process and return
    """
    # Step 1: Classify intent
    intent = classify_intent(request.message)

    # Step 2: Handle topic listing without LLM
    if intent == "topics":
        topics = search_engine.get_all_topics()
        stats = search_engine.get_stats()
        if not topics:
            response_text = "No study materials loaded yet. Upload some files in the Materials tab!"
        else:
            topic_list = "\n".join(f"• {t}" for t in topics[:40])
            response_text = (
                f"📚 **{stats['total_files']} files** loaded with "
                f"**{stats['total_chunks']} sections** ({stats['total_words']:,} words)\n\n"
                f"**Topics:**\n{topic_list}"
            )
        return ChatResponse(
            response=response_text,
            intent=intent,
            sources_used=0,
            topics_referenced=[],
        )

    # Step 3: Search for relevant material
    search_context = search_engine.search_formatted(request.message, top_k=5)
    search_results = search_engine.search(request.message, top_k=5)
    topics_found = list(set(r["section_title"] for r in search_results))

    # Step 4: Build prompt
    weak_areas = get_weak_areas(request.student_name)
    system_prompt = build_prompt(
        intent=intent,
        search_context=search_context,
        student_name=request.student_name,
        weak_areas=weak_areas,
    )
    messages = build_messages(
        user_message=request.message,
        conversation_history=request.conversation_history,
    )

    # Step 5: Call Gemini
    response_text = await gemini_chat(messages=messages, system_prompt=system_prompt)

    # Step 6: Post-process
    processed = format_response(response_text, intent)

    # Step 7: Save to chat history
    save_chat_message(request.student_name, "user", request.message, intent)
    save_chat_message(request.student_name, "assistant", processed["text"], intent)

    return ChatResponse(
        response=processed["text"],
        intent=intent,
        sources_used=len(search_results),
        topics_referenced=topics_found,
        quiz_data=processed.get("quiz_data"),
    )


@app.post("/upload")
async def upload_materials(files: list[UploadFile] = File(...)):
    """Upload and process study material files."""
    results = []

    for file in files:
        # Validate file type
        ext = Path(file.filename).suffix.lower()
        if ext not in (".docx", ".pptx", ".pdf", ".xlsx", ".xls", ".txt", ".md", ".csv"):
            results.append({"filename": file.filename, "status": "unsupported", "chunks": 0})
            continue

        # Save file
        save_path = os.path.join(UPLOAD_DIR, file.filename)
        content = await file.read()
        with open(save_path, "wb") as f:
            f.write(content)

        # Process it
        chunks = process_file(save_path)
        results.append({
            "filename": file.filename,
            "status": "success" if chunks else "no_content",
            "chunks": len(chunks),
        })

    # Rebuild full index from all uploaded files
    all_chunks = []
    for fname in os.listdir(UPLOAD_DIR):
        fpath = os.path.join(UPLOAD_DIR, fname)
        if os.path.isfile(fpath):
            all_chunks.extend(process_file(fpath))

    if all_chunks:
        from dataclasses import asdict
        chunk_dicts = [asdict(c) for c in all_chunks]
        save_chunks(all_chunks, CHUNKS_PATH)
        search_engine.load_chunks_from_list(chunk_dicts)

    return {
        "files_processed": results,
        "total_chunks": len(all_chunks),
        "stats": search_engine.get_stats(),
    }


@app.get("/search")
async def search_materials(query: str, top_k: int = 5):
    """Search materials directly — useful for debugging."""
    results = search_engine.search(query, top_k)
    return {"query": query, "results": results}


@app.get("/topics")
async def list_topics():
    """List all available study topics."""
    return {"topics": search_engine.get_all_topics(), "stats": search_engine.get_stats()}


@app.post("/quiz/submit")
async def submit_quiz(submission: QuizSubmission):
    """Record a quiz answer for progress tracking."""
    is_correct = (
        submission.student_answer.strip().lower()
        == submission.correct_answer.strip().lower()
    )
    save_quiz_result(
        student_name=submission.student_name,
        topic=submission.topic,
        question=submission.question,
        student_answer=submission.student_answer,
        correct_answer=submission.correct_answer,
        is_correct=is_correct,
    )
    return {"is_correct": is_correct, "correct_answer": submission.correct_answer}


@app.get("/progress/{student_name}")
async def student_progress(student_name: str = "default"):
    """Get study progress and weak areas."""
    return get_progress(student_name)


@app.get("/health")
async def health_check():
    """System status check."""
    gemini_configured = bool(
        os.getenv("GEMINI_API_KEY", "")
        and os.getenv("GEMINI_API_KEY") != "your_api_key_here"
    )
    return {
        "status": "ok",
        "gemini_configured": gemini_configured,
        "gemini_model": os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        "materials_loaded": len(search_engine.chunks) > 0,
        "stats": search_engine.get_stats(),
    }
