"""Dependency injection — shared instances available to route handlers."""

from app.retrieval.search import StudySearch

# Global search engine singleton — loaded at startup
search_engine = StudySearch()
