"""Extract from plain text / markdown files."""

import re
from pathlib import Path
from app.domain.documents import Chunk


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
                chunks.append(Chunk(
                    source_file=fname, source_type="md",
                    section_title=current_title, content=part,
                ))
        return chunks if chunks else [Chunk(
            source_file=fname, source_type="md",
            section_title="Full Document", content=content,
        )]

    paragraphs = re.split(r'\n\s*\n', content)
    chunks = []
    for i, para in enumerate(paragraphs):
        para = para.strip()
        if para and len(para.split()) > 5:
            chunks.append(Chunk(
                source_file=fname, source_type="txt",
                section_title=f"Section {i + 1}", content=para,
            ))

    return chunks if chunks else [Chunk(
        source_file=fname, source_type="txt",
        section_title="Full Document", content=content,
    )]
