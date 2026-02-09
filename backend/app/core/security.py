"""Upload validation and file-type allowlist."""

from pathlib import Path

ALLOWED_EXTENSIONS = frozenset(
    {".docx", ".pptx", ".pdf", ".xlsx", ".xls", ".txt", ".md", ".csv"}
)


def is_allowed_file(filename: str) -> bool:
    """Check if a file extension is in the allowlist."""
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS
