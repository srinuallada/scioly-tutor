"""Extract text from PDF, chunked by page."""

from pathlib import Path
from app.domain.documents import Chunk


def extract_pdf(filepath: str) -> list[Chunk]:
    import pdfplumber

    fname = Path(filepath).name
    chunks: list[Chunk] = []

    with pdfplumber.open(filepath) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            text = page.extract_text()
            if text and text.strip():
                chunks.append(Chunk(
                    source_file=fname, source_type="pdf",
                    section_title=f"Page {page_num}",
                    content=text.strip(), page_or_slide=page_num,
                ))

            tables = page.extract_tables()
            for t_idx, table in enumerate(tables):
                if table:
                    rows = []
                    for row in table:
                        cells = [str(c).strip() if c else "" for c in row]
                        rows.append(" | ".join(cells))
                    chunks.append(Chunk(
                        source_file=fname, source_type="pdf",
                        section_title=f"Page {page_num} — Table {t_idx + 1}",
                        content="\n".join(rows), page_or_slide=page_num,
                    ))

    return chunks
