"""Extract text from Word documents, chunked by heading."""

from pathlib import Path
from app.domain.documents import Chunk


def extract_docx(filepath: str) -> list[Chunk]:
    from docx import Document

    doc = Document(filepath)
    fname = Path(filepath).name
    chunks: list[Chunk] = []
    current_heading = "Introduction"
    current_text: list[str] = []

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        if para.style.name.startswith("Heading"):
            if current_text:
                chunks.append(Chunk(
                    source_file=fname, source_type="docx",
                    section_title=current_heading,
                    content="\n".join(current_text),
                ))
            current_heading = text
            current_text = []
        else:
            current_text.append(text)

    if current_text:
        chunks.append(Chunk(
            source_file=fname, source_type="docx",
            section_title=current_heading,
            content="\n".join(current_text),
        ))

    for i, table in enumerate(doc.tables):
        rows = []
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells]
            rows.append(" | ".join(cells))
        if rows:
            chunks.append(Chunk(
                source_file=fname, source_type="docx",
                section_title=f"Table {i + 1}",
                content="\n".join(rows),
            ))

    return chunks
