"""Tokenizer for BM25 search — keeps scientific terms intact."""

import re


def tokenize(text: str) -> list[str]:
    """
    Tokenize text for BM25 indexing/search.

    Keeps hyphenated scientific terms (e.g. "semi-circular") as single tokens.
    Drops single-character tokens.
    """
    text = text.lower()
    tokens = re.findall(r'[a-z0-9](?:[a-z0-9-]*[a-z0-9])?', text)
    return [t for t in tokens if len(t) > 1]
