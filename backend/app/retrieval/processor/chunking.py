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


# Minimum words for a chunk to be kept (unless it contains an image reference)
_MIN_CHUNK_WORDS = 30


def _has_image_ref(content: str) -> bool:
    """Check if chunk content contains a markdown image reference."""
    return "![" in content and "/api/images/" in content


def process_file(filepath: str) -> list[Chunk]:
    """Process a single file and return chunks."""
    ext = Path(filepath).suffix.lower()
    extractor = EXTRACTORS.get(ext)

    if not extractor:
        log.warning("Unsupported: %s (%s)", ext, filepath)
        return []

    try:
        raw_chunks = extractor(filepath)

        # Filter noisy low-signal chunks (keep image references regardless)
        filtered = [
            c for c in raw_chunks
            if c.word_count >= _MIN_CHUNK_WORDS or _has_image_ref(c.content)
        ]

        # Assign sequential chunk_index per source file
        for idx, chunk in enumerate(filtered):
            chunk.chunk_index = idx

        dropped = len(raw_chunks) - len(filtered)
        if dropped:
            log.info("%s: %d chunks (%d short chunks dropped)", Path(filepath).name, len(filtered), dropped)
        else:
            log.info("%s: %d chunks", Path(filepath).name, len(filtered))

        return filtered
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
