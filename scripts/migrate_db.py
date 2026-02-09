"""
Database migration helper.
Run from project root: python scripts/migrate_db.py
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.storage.db import init_db, get_db


def migrate():
    """Run any pending migrations."""
    print("Initializing database schema...")
    init_db()

    with get_db() as conn:
        tables = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()
        print(f"Tables: {[t['name'] for t in tables]}")

        for table in tables:
            count = conn.execute(f"SELECT COUNT(*) as c FROM {table['name']}").fetchone()
            print(f"  {table['name']}: {count['c']} rows")

    print("Migration complete.")


if __name__ == "__main__":
    migrate()
