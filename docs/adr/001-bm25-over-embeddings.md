# ADR-001: BM25 over Embeddings for Search

## Status
Accepted

## Context
We need a search mechanism to retrieve relevant study material chunks for the LLM context window. Options considered:
1. BM25 keyword search (rank-bm25)
2. Embedding-based semantic search (ChromaDB / FAISS)

## Decision
Use BM25 (keyword search) as the primary retrieval mechanism.

## Rationale
- **Scientific terminology**: Words like "cochlea", "mitosis", "retina" are distinctive keywords that BM25 handles well.
- **Zero cost**: No embedding model needed, no vector DB, no API calls for indexing.
- **Instant indexing**: New uploads are searchable immediately without embedding computation.
- **Good enough**: For a personal study tool with hundreds (not millions) of chunks, BM25 provides excellent recall.

## Upgrade Path
If semantic search is needed later, add ChromaDB alongside BM25 and blend scores.
