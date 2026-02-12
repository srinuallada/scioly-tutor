"""Extract from plain text / markdown files."""

import re
from pathlib import Path
from app.domain.documents import Chunk
from app.retrieval.processor.chunking_utils import split_text_to_chunks


def extract_text(filepath: str) -> list[Chunk]:
    fname = Path(filepath).name
    ext = Path(filepath).suffix.lower()

    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    if not content.strip():
        return []

    if ext in (".md", ".markdown"):
        sections = re.split(r'\n(#{1,3}\s+.+)', content)
        chunks: list[Chunk] = []
        current_title = "Introduction"

        for part in sections:
            part = part.strip()
            if not part:
                continue
            if re.match(r'^#{1,3}\s+', part):
                current_title = re.sub(r'^#{1,3}\s+', '', part)
            else:
                for idx, chunk_text in enumerate(split_text_to_chunks(part), 1):
                    chunks.append(Chunk(
                        source_file=fname, source_type="md",
                        section_title=f"{current_title} — Part {idx}", content=chunk_text,
                    ))
        if chunks:
            return chunks
        fallback = split_text_to_chunks(content)
        return [
            Chunk(
                source_file=fname, source_type="md",
                section_title="Full Document", content=chunk_text,
            )
            for chunk_text in (fallback or [content])
        ]

    chunks = []
    for idx, chunk_text in enumerate(split_text_to_chunks(content), 1):
        chunks.append(Chunk(
            source_file=fname, source_type="txt",
            section_title=f"Section {idx}", content=chunk_text,
        ))

    return chunks if chunks else [Chunk(
        source_file=fname, source_type="txt",
        section_title="Full Document", content=content,
    )]
