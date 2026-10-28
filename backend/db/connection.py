"""Opens the clinic database and runs SQL. Models call this. Routes do not.

A write the database refuses (a duplicate, a missing reference, a bad value) returns
False or None, because that is an answer the caller can act on. Anything else, such as
the database file being missing or locked, raises, and becomes a 503 response instead
of being mistaken for "no rows" or "already exists".
"""

import os
import sqlite3
from sqlite3 import Row, connect

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Overridable so tests, or a server with a separate data disk, can point elsewhere.
database = os.environ.get("HEALIX_DB", os.path.join(BASE_DIR, "clinic.db"))
studentdb = os.environ.get("HEALIX_STUDENT_DB", os.path.join(BASE_DIR, "students.db"))

# Errors that mean "the database said no to this write", not "the database is broken".
REJECTED_WRITE = (sqlite3.IntegrityError, sqlite3.InterfaceError, sqlite3.ProgrammingError)


def enable_wal():
    """Write-ahead logging: readers no longer wait for a writer, which matters once
    several staff use the app at once. The setting is stored in the database file."""
    conn = connect(database)
    try:
        conn.execute("PRAGMA journal_mode=WAL")
    finally:
        conn.close()


def getprocess(sql, values) -> list:
    conn = connect(database)
    try:
        conn.row_factory = Row
        return [dict(row) for row in conn.execute(sql, values).fetchall()]
    finally:
        conn.close()


def postprocess(sql, values) -> bool:
    cursor = _write(sql, values)
    return cursor is not None and cursor.rowcount > 0


def insertprocess(sql, values):
    """Runs an INSERT and returns the new row's id, or None if the database refused it."""
    cursor = _write(sql, values)
    return cursor.lastrowid if cursor is not None else None


def _write(sql, values):
    conn = connect(database)
    try:
        conn.execute("PRAGMA foreign_keys = ON;")
        cursor = conn.execute(sql, values)
        conn.commit()
        return cursor
    except REJECTED_WRITE as e:
        print("Write refused:", e)
        return None
    finally:
        conn.close()
