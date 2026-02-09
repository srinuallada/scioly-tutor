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
INDEX_DIR = DATA_DIR / "index"
CHUNKS_PATH = INDEX_DIR / "chunks.json"
DB_PATH = DATA_DIR / "app.db"

# Gemini
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# App
CORS_ORIGINS: list[str] = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

# Limits
MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
MAX_CONVERSATION_HISTORY: int = 10
SEARCH_TOP_K: int = 5
