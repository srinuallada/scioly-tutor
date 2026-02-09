"""Main processor — routes files to the correct extractor."""

import json
import logging
import os
import sys
from dataclasses import asdict
from pathlib import Path

log = logging.getLogger(__name__)

from app.domain.documents import Chunk
from app.retrieval.processor.extract_docx import extract_docx
from app.retrieval.processor.extract_pptx import extract_pptx
from app.retrieval.processor.extract_pdf import extract_pdf
from app.retrieval.processor.extract_xlsx import extract_xlsx
from app.retrieval.processor.extract_text import extract_text

EXTRACTORS = {
    ".docx": extract_docx,
    ".pptx": extract_pptx,
    ".pdf": extract_pdf,
    ".xlsx": extract_xlsx,
    ".xls": extract_xlsx,
    ".txt": extract_text,
    ".md": extract_text,
    ".markdown": extract_text,
    ".csv": extract_text,
}


def process_file(filepath: str) -> list[Chunk]:
    """Process a single file and return chunks."""
    ext = Path(filepath).suffix.lower()
    extractor = EXTRACTORS.get(ext)

    if not extractor:
        log.warning("Unsupported: %s (%s)", ext, filepath)
        return []

    try:
        chunks = extractor(filepath)
        log.info("%s: %d chunks", Path(filepath).name, len(chunks))
        return chunks
    except Exception as e:
        log.error("Error processing %s: %s", filepath, e)
        return []


def process_directory(directory: str) -> list[Chunk]:
    """Process all supported files in a directory (recursive)."""
    all_chunks: list[Chunk] = []
    dir_path = Path(directory)

    if not dir_path.exists():
        log.error("Directory not found: %s", directory)
        return []

    supported_files = []
    for ext in EXTRACTORS:
        supported_files.extend(dir_path.rglob(f"*{ext}"))

    log.info("Found %d files in %s", len(supported_files), directory)

    for filepath in sorted(supported_files):
        chunks = process_file(str(filepath))
        all_chunks.extend(chunks)

    log.info("Total: %d chunks, %d words", len(all_chunks), sum(c.word_count for c in all_chunks))
    return all_chunks


def save_chunks(chunks: list[Chunk], output_path: str) -> None:
    """Save processed chunks to JSON."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    data = [asdict(c) for c in chunks]
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)
    log.info("Saved %d chunks to %s", len(chunks), output_path)


def load_chunks(input_path: str) -> list[dict]:
    """Load chunks from JSON as dicts."""
    with open(input_path, "r") as f:
        return json.load(f)
