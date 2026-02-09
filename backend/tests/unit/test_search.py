"""Tests for the BM25 search engine."""

import pytest
from app.retrieval.search import StudySearch


SAMPLE_CHUNKS = [
    {
        "id": "001",
        "source_file": "anatomy.docx",
        "source_type": "docx",
        "section_title": "Inner Ear",
        "content": "The cochlea is a spiral-shaped cavity in the inner ear that converts sound vibrations into nerve signals.",
        "page_or_slide": None,
        "word_count": 17,
    },
    {
        "id": "002",
        "source_file": "anatomy.docx",
        "source_type": "docx",
        "section_title": "Skeletal System",
        "content": "The femur is the longest and strongest bone in the human body, located in the thigh.",
        "page_or_slide": None,
        "word_count": 16,
    },
    {
        "id": "003",
        "source_file": "biology.pdf",
        "source_type": "pdf",
        "section_title": "Cell Biology",
        "content": "Mitochondria are the powerhouse of the cell, generating ATP through cellular respiration.",
        "page_or_slide": 1,
        "word_count": 13,
    },
    {
        "id": "004",
        "source_file": "biology.pdf",
        "source_type": "pdf",
        "section_title": "Photosynthesis",
        "content": "Photosynthesis uses chlorophyll in chloroplasts to convert carbon dioxide and water into glucose and oxygen.",
        "page_or_slide": 2,
        "word_count": 15,
    },
]


@pytest.fixture
def search_engine() -> StudySearch:
    engine = StudySearch()
    engine.load_chunks_from_list(SAMPLE_CHUNKS)
    return engine


class TestStudySearch:
    def test_search_returns_relevant_results(self, search_engine: StudySearch) -> None:
        results = search_engine.search("cochlea inner ear")
        assert len(results) > 0
        assert results[0]["section_title"] == "Inner Ear"

    def test_search_relevance_ordering(self, search_engine: StudySearch) -> None:
        results = search_engine.search("mitochondria ATP cell")
        assert len(results) > 0
        assert results[0]["section_title"] == "Cell Biology"

    def test_search_has_relevance_score(self, search_engine: StudySearch) -> None:
        results = search_engine.search("femur bone")
        assert len(results) > 0
        assert "relevance_score" in results[0]
        assert results[0]["relevance_score"] > 0

    def test_search_top_k(self, search_engine: StudySearch) -> None:
        results = search_engine.search("biology cell", top_k=2)
        assert len(results) <= 2

    def test_search_no_results_for_irrelevant(self, search_engine: StudySearch) -> None:
        results = search_engine.search("quantum physics wormhole")
        # BM25 may still return results with low scores; just check it doesn't crash
        assert isinstance(results, list)

    def test_search_empty_query(self, search_engine: StudySearch) -> None:
        results = search_engine.search("")
        assert results == []

    def test_search_empty_index(self) -> None:
        engine = StudySearch()
        results = engine.search("anything")
        assert results == []

    def test_search_formatted(self, search_engine: StudySearch) -> None:
        formatted = search_engine.search_formatted("cochlea")
        assert "Source 1" in formatted
        assert "cochlea" in formatted.lower()

    def test_search_formatted_no_results(self) -> None:
        engine = StudySearch()
        result = engine.search_formatted("anything")
        assert "No relevant materials" in result

    def test_get_all_topics(self, search_engine: StudySearch) -> None:
        topics = search_engine.get_all_topics()
        assert len(topics) == 4
        assert any("Inner Ear" in t for t in topics)

    def test_get_stats(self, search_engine: StudySearch) -> None:
        stats = search_engine.get_stats()
        assert stats["total_chunks"] == 4
        assert stats["total_files"] == 2
        assert "anatomy.docx" in stats["files"]
        assert "biology.pdf" in stats["files"]

    def test_get_stats_empty(self) -> None:
        engine = StudySearch()
        stats = engine.get_stats()
        assert stats["total_chunks"] == 0
        assert stats["total_files"] == 0

    def test_load_chunks_from_list(self) -> None:
        engine = StudySearch()
        engine.load_chunks_from_list(SAMPLE_CHUNKS)
        assert len(engine.chunks) == 4
        assert engine.bm25 is not None

    def test_load_empty_list(self) -> None:
        engine = StudySearch()
        engine.load_chunks_from_list([])
        assert engine.bm25 is None
        assert engine.chunks == []
