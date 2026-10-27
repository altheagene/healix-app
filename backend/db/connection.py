"""Opens the clinic database and runs SQL. Models call this. Routes do not."""

import os
from sqlite3 import Row, connect

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
database = os.path.join(BASE_DIR, "clinic.db")
studentdb = os.path.join(BASE_DIR, "students.db")


def getprocess(sql, values) -> list:
    try:
        conn = connect(database)
        conn.row_factory = Row
        cursor = conn.cursor()
        cursor.execute(sql, values)
        data = cursor.fetchall()
        cursor.close()
        conn.close()

        return [dict(row) for row in data]

    except Exception as e:
        print("GET error:", e)
        return []


def postprocess(sql, values) -> bool:
    cursor = _write(sql, values)
    return cursor is not None and cursor.rowcount > 0


def insertprocess(sql, values):
    """Runs an INSERT and returns the new row's id, or None if it failed."""
    cursor = _write(sql, values)
    return cursor.lastrowid if cursor is not None else None


def _write(sql, values):
    conn = None
    try:
        conn = connect(database)
        print(sql)
        conn.execute("PRAGMA foreign_keys = ON;")
        cursor = conn.cursor()
        cursor.execute(sql, values)
        conn.commit()
        return cursor

    except Exception as e:
        print("POST error:", e)
        return None
    finally:
        if conn is not None:
            conn.close()
