"""Tests for document domain types."""

import pytest
from app.domain.documents import Chunk


class TestChunk:
    def test_word_count_auto_calculated(self) -> None:
        chunk = Chunk(
            source_file="test.docx",
            source_type="docx",
            section_title="Test",
            content="one two three four five",
        )
        assert chunk.word_count == 5

    def test_id_auto_generated(self) -> None:
        chunk = Chunk(
            source_file="test.docx",
            source_type="docx",
            section_title="Test",
            content="some content",
        )
        assert chunk.id != ""
        assert len(chunk.id) == 12

    def test_same_content_same_id(self) -> None:
        c1 = Chunk(source_file="a.docx", source_type="docx", section_title="S", content="same")
        c2 = Chunk(source_file="a.docx", source_type="docx", section_title="S", content="same")
        assert c1.id == c2.id

    def test_different_content_different_id(self) -> None:
        c1 = Chunk(source_file="a.docx", source_type="docx", section_title="S", content="one")
        c2 = Chunk(source_file="a.docx", source_type="docx", section_title="S", content="two")
        assert c1.id != c2.id

    def test_optional_page(self) -> None:
        chunk = Chunk(
            source_file="test.pdf",
            source_type="pdf",
            section_title="Test",
            content="content",
            page_or_slide=3,
        )
        assert chunk.page_or_slide == 3

    def test_empty_content(self) -> None:
        chunk = Chunk(
            source_file="test.docx",
            source_type="docx",
            section_title="Test",
            content="",
        )
        assert chunk.word_count == 0
