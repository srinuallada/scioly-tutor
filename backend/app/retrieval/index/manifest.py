"""Index manifest — versioning and checksums for the search index."""

import json
import os
from app.settings import INDEX_DIR
from app.retrieval.index.schemas import IndexManifest

MANIFEST_PATH = os.path.join(str(INDEX_DIR), "manifest.json")


def save_manifest(manifest: IndexManifest) -> None:
    """Write the index manifest to disk."""
    os.makedirs(str(INDEX_DIR), exist_ok=True)
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest.to_dict(), f, indent=2)


def load_manifest() -> IndexManifest | None:
    """Load the index manifest, or None if it doesn't exist."""
    if not os.path.exists(MANIFEST_PATH):
        return None
    with open(MANIFEST_PATH, "r") as f:
        data = json.load(f)
    return IndexManifest(**data)
