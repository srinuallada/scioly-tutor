"""Tests for the BM25 tokenizer."""

import pytest
from app.retrieval.index.tokenizer import tokenize


class TestTokenize:
    def test_basic_words(self) -> None:
        result = tokenize("the inner ear")
        assert "inner" in result
        assert "ear" in result

    def test_lowercases(self) -> None:
        result = tokenize("The COCHLEA")
        assert "the" in result
        assert "cochlea" in result

    def test_preserves_hyphenated_terms(self) -> None:
        result = tokenize("semi-circular canals")
        assert "semi-circular" in result
        assert "canals" in result

    def test_drops_single_chars(self) -> None:
        result = tokenize("a b c word")
        assert "a" not in result
        assert "b" not in result
        assert "word" in result

    def test_handles_numbers(self) -> None:
        result = tokenize("vitamin B12 and omega-3")
        assert "b12" in result
        assert "omega-3" in result

    def test_strips_punctuation(self) -> None:
        result = tokenize("mitosis, meiosis. DNA!")
        assert "mitosis" in result
        assert "meiosis" in result
        assert "dna" in result

    def test_empty_string(self) -> None:
        assert tokenize("") == []

    def test_only_punctuation(self) -> None:
        assert tokenize("...!?@#$") == []

    def test_scientific_terms(self) -> None:
        result = tokenize("The mitochondria produces ATP via oxidative phosphorylation")
        assert "mitochondria" in result
        assert "atp" in result
        assert "oxidative" in result
        assert "phosphorylation" in result
