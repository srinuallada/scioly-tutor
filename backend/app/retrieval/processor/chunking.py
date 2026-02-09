"""Main processor — routes files to the correct extractor."""

import json
import os
import sys
from dataclasses import asdict
from pathlib import Path

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
        print(f"  Unsupported: {ext} ({filepath})")
        return []

    try:
        chunks = extractor(filepath)
        print(f"  {Path(filepath).name}: {len(chunks)} chunks")
        return chunks
    except Exception as e:
        print(f"  Error {filepath}: {e}")
        return []


def process_directory(directory: str) -> list[Chunk]:
    """Process all supported files in a directory (recursive)."""
    all_chunks: list[Chunk] = []
    dir_path = Path(directory)

    if not dir_path.exists():
        print(f"Directory not found: {directory}")
        return []

    supported_files = []
    for ext in EXTRACTORS:
        supported_files.extend(dir_path.rglob(f"*{ext}"))

    print(f"\nFound {len(supported_files)} files in {directory}\n")

    for filepath in sorted(supported_files):
        chunks = process_file(str(filepath))
        all_chunks.extend(chunks)

    print(f"\nTotal: {len(all_chunks)} chunks, {sum(c.word_count for c in all_chunks):,} words")
    return all_chunks


def save_chunks(chunks: list[Chunk], output_path: str) -> None:
    """Save processed chunks to JSON."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    data = [asdict(c) for c in chunks]
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Saved {len(chunks)} chunks to {output_path}")


def load_chunks(input_path: str) -> list[dict]:
    """Load chunks from JSON as dicts."""
    with open(input_path, "r") as f:
        return json.load(f)
