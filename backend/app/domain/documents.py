"""Domain types for document processing."""

import hashlib
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Chunk:
    """A searchable piece of study material."""

    source_file: str
    source_type: str
    section_title: str
    content: str
    page_or_slide: Optional[int] = None
    chunk_index: int = 0
    word_count: int = 0
    id: str = ""

    def __post_init__(self) -> None:
        self.word_count = len(self.content.split())
        if not self.id:
            raw = f"{self.source_file}:{self.section_title}:{self.content[:100]}"
            self.id = hashlib.md5(raw.encode()).hexdigest()[:12]
