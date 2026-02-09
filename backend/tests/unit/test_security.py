"""Tests for file security validation."""

import pytest
from app.core.security import is_allowed_file


class TestIsAllowedFile:
    @pytest.mark.parametrize("filename", [
        "notes.docx",
        "slides.pptx",
        "report.pdf",
        "data.xlsx",
        "legacy.xls",
        "readme.txt",
        "notes.md",
        "data.csv",
    ])
    def test_allowed_extensions(self, filename: str) -> None:
        assert is_allowed_file(filename) is True

    @pytest.mark.parametrize("filename", [
        "script.py",
        "program.exe",
        "config.json",
        "image.png",
        "archive.zip",
        "page.html",
        "style.css",
        "code.js",
        "binary.bin",
    ])
    def test_disallowed_extensions(self, filename: str) -> None:
        assert is_allowed_file(filename) is False

    def test_case_insensitive(self) -> None:
        assert is_allowed_file("notes.DOCX") is True
        assert is_allowed_file("slides.PPTX") is True
        assert is_allowed_file("report.PDF") is True

    def test_no_extension(self) -> None:
        assert is_allowed_file("noextension") is False

    def test_hidden_file(self) -> None:
        assert is_allowed_file(".env") is False

    def test_double_extension(self) -> None:
        # Only the last extension matters
        assert is_allowed_file("notes.txt.exe") is False
        assert is_allowed_file("data.csv.txt") is True
