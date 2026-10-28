"""Adds columns newer code needs to databases created before it. Runs at startup.
Each step only adds; nothing is renamed or dropped, so running it twice is harmless."""

from db.connection import getprocess, postprocess
from school import LEGACY_NAMES

# (table, column, definition)
COLUMNS = [
    # Graduated or departed patients are archived, not deleted, so their records are kept.
    ("patients", "archived", "INTEGER NOT NULL DEFAULT 0"),
    # Structured visit notes, alongside the free-text notes.
    ("visit_logs", "complaint", "TEXT"),
    ("visit_logs", "assessment", "TEXT"),
    ("visit_logs", "treatment", "TEXT"),
    # How the visit ended and whether a parent was told. Visits saved before these
    # existed have no time_in, so they never show as "still in the clinic".
    ("visit_logs", "time_in", "TEXT"),
    ("visit_logs", "time_out", "TEXT"),
    ("visit_logs", "disposition", "TEXT"),
    ("visit_logs", "referred_to", "TEXT"),
    ("visit_logs", "picked_up_by", "TEXT"),
    ("visit_logs", "picked_up_at", "TEXT"),
    ("visit_logs", "parent_notified", "INTEGER NOT NULL DEFAULT 0"),
    ("visit_logs", "notified_at", "TEXT"),
    ("visit_logs", "notified_method", "TEXT"),
    ("visit_logs", "notified_by", "TEXT"),
    # Senior High School track/strand (STEM, ABM, ...). See school.py.
    ("patients", "strand", "TEXT"),
]


def run_migrations():
    for table, column, definition in COLUMNS:
        existing = {row["name"].lower() for row in getprocess(f"PRAGMA table_info({table})", [])}
        if column.lower() not in existing:
            postprocess(f"ALTER TABLE {table} ADD COLUMN {column} {definition}", [])

    # Older records used other names for some departments; move them to the current list.
    for old_name, department in LEGACY_NAMES.items():
        postprocess("UPDATE patients SET department = ? WHERE department = ?", [department, old_name])
