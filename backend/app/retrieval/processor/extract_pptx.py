"""Extract text from PowerPoint, one chunk per slide + speaker notes."""

from pathlib import Path
from app.domain.documents import Chunk


def extract_pptx(filepath: str) -> list[Chunk]:
    from pptx import Presentation
    from pptx.enum.shapes import MSO_SHAPE_TYPE

    prs = Presentation(filepath)
    fname = Path(filepath).name
    chunks: list[Chunk] = []

    for slide_num, slide in enumerate(prs.slides, 1):
        title = ""
        body_parts: list[str] = []

        for shape in slide.shapes:
            if shape.has_text_frame:
                if (hasattr(shape, "placeholder_format")
                        and shape.placeholder_format is not None
                        and shape.placeholder_format.idx == 0):
                    title = shape.text_frame.text.strip()
                    continue
                for para in shape.text_frame.paragraphs:
                    text = para.text.strip()
                    if text:
                        body_parts.append(text)

            if shape.has_table:
                for row in shape.table.rows:
                    cells = [cell.text.strip() for cell in row.cells]
                    body_parts.append(" | ".join(cells))

            if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                body_parts.append("[Image on slide]")
            if shape.has_chart:
                body_parts.append("[Chart on slide]")

        if not title:
            title = f"Slide {slide_num}"

        content = "\n".join(body_parts)
        if content.strip():
            chunks.append(Chunk(
                source_file=fname, source_type="pptx",
                section_title=title, content=content,
                page_or_slide=slide_num,
            ))

        if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
            notes = slide.notes_slide.notes_text_frame.text.strip()
            if notes:
                chunks.append(Chunk(
                    source_file=fname, source_type="pptx",
                    section_title=f"Notes — {title}",
                    content=notes, page_or_slide=slide_num,
                ))

    return chunks
