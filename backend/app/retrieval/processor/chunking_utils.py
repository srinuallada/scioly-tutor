"""Shared chunking utilities for extractors."""

import re
from typing import Iterable


def _split_paragraphs(text: str) -> list[str]:
    parts = re.split(r"\n\s*\n", text)
    return [p.strip() for p in parts if p.strip()]


def split_text_to_chunks(
    text: str,
    *,
    min_words: int = 30,
    max_words: int = 250,
    overlap_words: int = 30,
) -> list[str]:
    """
    Split text into roughly max_words chunks with overlap.
    Uses paragraphs as the primary unit.
    """
    if not text or not text.strip():
        return []

    paragraphs = _split_paragraphs(text)
    if not paragraphs:
        return []

    chunks: list[str] = []
    current: list[str] = []
    current_words = 0

    def flush() -> None:
        nonlocal current, current_words
        if not current:
            return
        chunk_text = "\n".join(current).strip()
        if chunk_text and len(chunk_text.split()) >= min_words:
            chunks.append(chunk_text)
        current = []
        current_words = 0

    for para in paragraphs:
        words = para.split()
        word_count = len(words)
        if word_count > max_words:
            # Split oversized paragraph by sentence-ish boundaries.
            sentences = re.split(r"(?<=[.!?])\s+", para)
            for sentence in sentences:
                s_words = sentence.split()
                if current_words + len(s_words) > max_words and current:
                    flush()
                current.append(sentence)
                current_words += len(s_words)
            continue

        if current_words + word_count > max_words and current:
            flush()
        current.append(para)
        current_words += word_count

    flush()

    if overlap_words <= 0 or len(chunks) <= 1:
        return chunks

    # Add overlap by carrying tail words forward.
    overlapped: list[str] = []
    for idx, chunk in enumerate(chunks):
        if idx == 0:
            overlapped.append(chunk)
            continue
        prev_words = chunks[idx - 1].split()
        overlap = " ".join(prev_words[-overlap_words:]) if prev_words else ""
        overlapped.append((overlap + "\n" + chunk).strip() if overlap else chunk)

    return overlapped
