"""Search service — thin wrapper around StudySearch."""

from app.retrieval.search import StudySearch


def search_materials(query: str, top_k: int, search_engine: StudySearch) -> dict:
    """Search materials and return results."""
    results = search_engine.search(query, top_k)
    return {"query": query, "results": results}
