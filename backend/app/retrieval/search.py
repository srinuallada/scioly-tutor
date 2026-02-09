"""
BM25 search engine for study materials.
Free, local, no embeddings needed.
"""

import json
import logging
from rank_bm25 import BM25Okapi

from app.retrieval.index.tokenizer import tokenize

log = logging.getLogger(__name__)


class StudySearch:
    """Search engine using BM25 — same algorithm behind Elasticsearch."""

    def __init__(self) -> None:
        self.chunks: list[dict] = []
        self.bm25: BM25Okapi | None = None
        self._tokenized: list[list[str]] = []

    def load_chunks(self, chunks_path: str) -> None:
        """Load chunks from JSON and build the search index."""
        with open(chunks_path, "r") as f:
            self.chunks = json.load(f)

        self._tokenized = [
            tokenize(f"{c['section_title']} {c['content']}")
            for c in self.chunks
        ]
        self.bm25 = BM25Okapi(self._tokenized)
        log.info("Index built: %d chunks", len(self.chunks))

    def load_chunks_from_list(self, chunks: list[dict]) -> None:
        """Build index from an in-memory list of chunk dicts."""
        self.chunks = chunks
        self._tokenized = [
            tokenize(f"{c['section_title']} {c['content']}")
            for c in self.chunks
        ]
        self.bm25 = BM25Okapi(self._tokenized) if self._tokenized else None

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        """Search materials. Returns top_k chunks with relevance scores."""
        if not self.bm25 or not self.chunks:
            return []

        tokenized_query = tokenize(query)
        if not tokenized_query:
            return []

        scores = self.bm25.get_scores(tokenized_query)
        ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:top_k]

        results = []
        for idx, score in ranked:
            if score > 0:
                chunk = self.chunks[idx].copy()
                chunk["relevance_score"] = round(float(score), 3)
                results.append(chunk)

        return results

    def search_formatted(self, query: str, top_k: int = 5) -> str:
        """Search and return formatted context string for the LLM."""
        results = self.search(query, top_k)

        if not results:
            return "No relevant materials found for this question."

        parts = []
        for i, r in enumerate(results, 1):
            source = f"[{r['source_file']}"
            if r.get("page_or_slide"):
                label = "Slide" if r["source_type"] == "pptx" else "Page"
                source += f" — {label} {r['page_or_slide']}"
            source += f" — {r['section_title']}]"

            parts.append(f"--- Source {i} {source} ---\n{r['content']}")

        return "\n\n".join(parts)

    def get_all_topics(self) -> list[str]:
        """Get all unique section titles."""
        topics = set()
        for chunk in self.chunks:
            topics.add(f"{chunk['source_file']} → {chunk['section_title']}")
        return sorted(topics)

    def get_stats(self) -> dict:
        """Get statistics about loaded materials."""
        if not self.chunks:
            return {"total_chunks": 0, "total_files": 0, "files": [], "total_words": 0}

        files = set(c["source_file"] for c in self.chunks)
        total_words = sum(c.get("word_count", 0) for c in self.chunks)

        return {
            "total_chunks": len(self.chunks),
            "total_files": len(files),
            "files": sorted(files),
            "total_words": total_words,
        }
