"""
SciOly Tutor — FastAPI Backend

Start: cd backend && uvicorn app.main:app --reload --port 8000
Docs:  http://localhost:8000/docs
"""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

log = logging.getLogger(__name__)

from app.settings import UPLOAD_DIR, IMAGES_DIR, INDEX_DIR, CHUNKS_PATH, SOURCE_LINKS_PATH
from app.core.middleware import register_middleware
from app.storage.db import init_db
from app.api.deps import search_engine

from app.core.auth import require_auth, router as auth_router
from app.api.routes import health, chat, upload, search, topics, quiz, progress, images

# Path to built frontend (exists only in Cloud Run / Docker)
STATIC_DIR = Path(__file__).resolve().parent / "static"


def _reload_search_index() -> None:
    """Rebuild the search index from chunks file."""
    chunks_path = str(CHUNKS_PATH)
    if os.path.exists(chunks_path):
        search_engine.load_chunks(chunks_path)
    else:
        log.info("No chunks found. Upload materials to get started.")
    search_engine.load_source_links(str(SOURCE_LINKS_PATH))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Startup: init DB, create dirs, load search index."""
    os.makedirs(str(UPLOAD_DIR), exist_ok=True)
    os.makedirs(str(IMAGES_DIR), exist_ok=True)
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
# Health check has no auth — Cloud Run needs unauthenticated health probes
app.include_router(
    health.router,
    prefix="/api",
    tags=["system"],
)
# Auth verify — no dependencies wrapper (require_auth is inside the route)
app.include_router(
    auth_router,
    prefix="/api",
    tags=["auth"],
)
app.include_router(
    chat.router,
    prefix="/api",
    tags=["chat"],
    dependencies=[Depends(require_auth)],
)
app.include_router(
    upload.router,
    prefix="/api",
    tags=["materials"],
    dependencies=[Depends(require_auth)],
)
app.include_router(
    search.router,
    prefix="/api",
    tags=["materials"],
    dependencies=[Depends(require_auth)],
)
app.include_router(
    topics.router,
    prefix="/api",
    tags=["materials"],
    dependencies=[Depends(require_auth)],
)
app.include_router(
    quiz.router,
    prefix="/api",
    tags=["quiz"],
    dependencies=[Depends(require_auth)],
)
app.include_router(
    progress.router,
    prefix="/api",
    tags=["progress"],
    dependencies=[Depends(require_auth)],
)
# Images route handles its own auth via ?token= query param
app.include_router(
    images.router,
    prefix="/api",
    tags=["materials"],
)

# ── Serve built frontend (Cloud Run / Docker only) ────────────────
if STATIC_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="static-assets")

    @app.get("/{path:path}")
    async def spa_fallback(path: str):
        """Serve index.html for all non-API routes (SPA client-side routing)."""
        file = (STATIC_DIR / path).resolve()
        # Prevent path traversal — file must be inside STATIC_DIR
        if file.is_file() and str(file).startswith(str(STATIC_DIR.resolve())):
            return FileResponse(str(file))
        return FileResponse(str(STATIC_DIR / "index.html"))
