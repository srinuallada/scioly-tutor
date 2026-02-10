"""Extract text from PDF, chunked by page."""

import logging
from pathlib import Path
from urllib.parse import quote

from app.domain.documents import Chunk
from app.settings import IMAGES_DIR

log = logging.getLogger(__name__)

# Minimum image area (width * height) to be considered a meaningful diagram
# Filters out tiny icons, logos, and decorative elements
_MIN_IMAGE_AREA = 50_000  # ~224x224 pixels


def _has_meaningful_images(page) -> bool:
    """Check if a page has images large enough to be diagrams/figures."""
    for img in page.images:
        w = abs(img.get("x1", 0) - img.get("x0", 0))
        h = abs(img.get("bottom", 0) - img.get("top", 0))
        if w * h >= _MIN_IMAGE_AREA:
            return True
    return False


def extract_pdf(filepath: str) -> list[Chunk]:
    import pdfplumber

    fname = Path(filepath).name
    stem = Path(filepath).stem
    chunks: list[Chunk] = []

    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    with pdfplumber.open(filepath) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            text = page.extract_text()

            # Only render page if it has large enough images to be diagrams
            page_image_md = ""
            if page.images and _has_meaningful_images(page):
                try:
                    filename = f"{stem}_p{page_num}.png"
                    out_path = IMAGES_DIR / filename
                    img = page.to_image(resolution=150)
                    img.save(str(out_path), format="PNG")
                    page_image_md = f"![Page {page_num}](/api/images/{quote(filename)})"
                except Exception:
                    log.warning("Could not render page %d of %s", page_num, fname, exc_info=True)

            if text and text.strip():
                content = text.strip()
                if page_image_md:
                    content = page_image_md + "\n\n" + content
                chunks.append(Chunk(
                    source_file=fname, source_type="pdf",
                    section_title=f"Page {page_num}",
                    content=content, page_or_slide=page_num,
                ))
            elif page_image_md:
                # Page has images but no extractable text (scanned page)
                chunks.append(Chunk(
                    source_file=fname, source_type="pdf",
                    section_title=f"Page {page_num}",
                    content=page_image_md, page_or_slide=page_num,
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
