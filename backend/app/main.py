"""
SciOly Tutor — FastAPI Backend

Start: cd backend && uvicorn app.main:app --reload --port 8000
Docs:  http://localhost:8000/docs
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI

log = logging.getLogger(__name__)

from app.settings import UPLOAD_DIR, INDEX_DIR, CHUNKS_PATH
from app.core.middleware import register_middleware
from app.storage.db import init_db
from app.api.deps import search_engine

from app.api.routes import health, chat, upload, search, topics, quiz, progress


def _reload_search_index() -> None:
    """Rebuild the search index from chunks file."""
    chunks_path = str(CHUNKS_PATH)
    if os.path.exists(chunks_path):
        search_engine.load_chunks(chunks_path)
    else:
        log.info("No chunks found. Upload materials to get started.")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Startup: init DB, create dirs, load search index."""
    os.makedirs(str(UPLOAD_DIR), exist_ok=True)
    os.makedirs(str(INDEX_DIR), exist_ok=True)
    init_db()
    _reload_search_index()
    yield


app = FastAPI(
    title="SciOly Tutor API",
    description="Free, local Science Olympiad study agent",
    version="0.2.0",
    lifespan=lifespan,
)

register_middleware(app)

# All routes under /api/*
app.include_router(health.router, prefix="/api", tags=["system"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(upload.router, prefix="/api", tags=["materials"])
app.include_router(search.router, prefix="/api", tags=["materials"])
app.include_router(topics.router, prefix="/api", tags=["materials"])
app.include_router(quiz.router, prefix="/api", tags=["quiz"])
app.include_router(progress.router, prefix="/api", tags=["progress"])
