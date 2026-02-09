"""Upload service — save files, process, update index."""

import os
from dataclasses import asdict
from pathlib import Path

from app.core.security import is_allowed_file
from app.core.errors import AppError
from app.retrieval.processor import process_file, save_chunks
from app.retrieval.search import StudySearch
from app.settings import UPLOAD_DIR, CHUNKS_PATH, MAX_UPLOAD_SIZE_MB


async def handle_upload(
    files: list,
    search_engine: StudySearch,
) -> dict:
    """
    Save uploaded files, process them, and rebuild the search index.

    Args:
        files: List of UploadFile objects from FastAPI
        search_engine: The global search engine instance

    Returns:
        dict with files_processed, total_chunks, stats
    """
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    results = []

    for file in files:
        if not is_allowed_file(file.filename):
            results.append({"filename": file.filename, "status": "unsupported", "chunks": 0})
            continue

        save_path = os.path.join(UPLOAD_DIR, file.filename)
        content = await file.read()

        max_bytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            results.append({"filename": file.filename, "status": f"too_large (>{MAX_UPLOAD_SIZE_MB}MB)", "chunks": 0})
            continue

        with open(save_path, "wb") as f:
            f.write(content)

        chunks = process_file(save_path)
        results.append({
            "filename": file.filename,
            "status": "success" if chunks else "no_content",
            "chunks": len(chunks),
        })

    # Rebuild full index from all uploaded files
    all_chunks = []
    for fname in os.listdir(str(UPLOAD_DIR)):
        fpath = os.path.join(str(UPLOAD_DIR), fname)
        if os.path.isfile(fpath):
            all_chunks.extend(process_file(fpath))

    if all_chunks:
        chunk_dicts = [asdict(c) for c in all_chunks]
        os.makedirs(os.path.dirname(str(CHUNKS_PATH)), exist_ok=True)
        save_chunks(all_chunks, str(CHUNKS_PATH))
        search_engine.load_chunks_from_list(chunk_dicts)

    return {
        "files_processed": results,
        "total_chunks": len(all_chunks),
        "stats": search_engine.get_stats(),
    }
