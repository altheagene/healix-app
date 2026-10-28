"""Adds columns newer code needs to databases created before it. Runs at startup.
Each step only adds; nothing is renamed or dropped, so running it twice is harmless."""

from db.connection import getprocess, postprocess

# (table, column, definition)
COLUMNS = [
    # Graduated or departed patients are archived, not deleted, so their records are kept.
    ("patients", "archived", "INTEGER NOT NULL DEFAULT 0"),
    # Structured visit notes, alongside the free-text notes.
    ("visit_logs", "complaint", "TEXT"),
    ("visit_logs", "assessment", "TEXT"),
    ("visit_logs", "treatment", "TEXT"),
]


def run_migrations():
    for table, column, definition in COLUMNS:
        existing = {row["name"].lower() for row in getprocess(f"PRAGMA table_info({table})", [])}
        if column.lower() not in existing:
            postprocess(f"ALTER TABLE {table} ADD COLUMN {column} {definition}", [])
