"""
CLI to process study materials into the search index.

Usage:
    cd backend
    python -m app.process_materials ../materials
"""

import logging
import sys
from pathlib import Path

from app.retrieval.processor import process_directory, save_chunks
from app.settings import CHUNKS_PATH

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python -m app.process_materials <materials_directory>")
        sys.exit(1)

    materials_dir = Path(sys.argv[1]).resolve()
    if not materials_dir.is_dir():
        print(f"Error: {materials_dir} is not a directory")
        sys.exit(1)

    chunks = process_directory(str(materials_dir))
    if not chunks:
        print("No chunks produced. Check that the directory contains supported files.")
        sys.exit(1)

    save_chunks(chunks, str(CHUNKS_PATH))
    print(f"\nDone — {len(chunks)} chunks saved to {CHUNKS_PATH}")


if __name__ == "__main__":
    main()
