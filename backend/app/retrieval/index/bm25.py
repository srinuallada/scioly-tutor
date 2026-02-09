"""BM25 index builder — wraps rank-bm25 with build/load/save."""

from rank_bm25 import BM25Okapi
from app.retrieval.index.tokenizer import tokenize


def build_index(chunks: list[dict]) -> tuple[BM25Okapi, list[list[str]]]:
    """
    Build a BM25 index from chunk dicts.

    Returns (bm25_index, tokenized_corpus).
    """
    corpus = [
        tokenize(f"{c['section_title']} {c['content']}")
        for c in chunks
    ]
    bm25 = BM25Okapi(corpus) if corpus else None
    return bm25, corpus


def query_index(
    bm25: BM25Okapi,
    chunks: list[dict],
    query: str,
    top_k: int = 5,
) -> list[dict]:
    """
    Query the BM25 index and return top_k ranked chunks.
    """
    tokens = tokenize(query)
    if not tokens or bm25 is None:
        return []

    scores = bm25.get_scores(tokens)
    ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:top_k]

    results = []
    for idx, score in ranked:
        if score > 0:
            chunk = chunks[idx].copy()
            chunk["relevance_score"] = round(float(score), 3)
            results.append(chunk)

    return results
