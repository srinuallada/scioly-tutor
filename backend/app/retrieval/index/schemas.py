"""Schemas for chunk storage and index manifest."""

from dataclasses import dataclass, asdict
from typing import Optional


@dataclass
class ChunkRecord:
    """A single chunk as stored in chunks.json / chunks.jsonl."""
    id: str
    source_file: str
    source_type: str
    section_title: str
    content: str
    page_or_slide: Optional[int]
    word_count: int

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class IndexManifest:
    """Metadata about the current search index."""
    version: int
    total_chunks: int
    total_files: int
    total_words: int
    files: list[str]

    def to_dict(self) -> dict:
        return asdict(self)
