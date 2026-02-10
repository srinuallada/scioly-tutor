"""
Environment configuration.
All settings read from env vars (with sensible defaults).
"""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
IMAGES_DIR = DATA_DIR / "images"
INDEX_DIR = DATA_DIR / "index"
CHUNKS_PATH = INDEX_DIR / "chunks.json"
SOURCE_LINKS_PATH = INDEX_DIR / "source_links.json"
DB_PATH = DATA_DIR / "app.db"

# Gemini
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# App
_CORS_ENV = os.getenv("CORS_ORIGINS", "").strip()
if _CORS_ENV:
    CORS_ORIGINS: list[str] = [origin.strip() for origin in _CORS_ENV.split(",") if origin.strip()]
else:
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
REQUIRE_AUTH: bool = os.getenv("REQUIRE_AUTH", "true").lower() == "true"

# Semicolon or comma-separated list of allowed emails (empty = allow all authenticated users)
_ALLOWED_ENV = os.getenv("ALLOWED_EMAILS", "").strip()
ALLOWED_EMAILS: set[str] = {e.strip().lower() for e in _ALLOWED_ENV.replace(";", ",").split(",") if e.strip()} if _ALLOWED_ENV else set()

# Cloud Run: disable uploads when data is baked into the image
# Auto-detects Cloud Run via K_SERVICE env var, or set DISABLE_UPLOADS explicitly
_disable_default = "true" if os.getenv("K_SERVICE") else "false"
DISABLE_UPLOADS: bool = os.getenv("DISABLE_UPLOADS", _disable_default).lower() == "true"

# Limits
MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
MAX_CONVERSATION_HISTORY: int = 10
SEARCH_TOP_K: int = 5
