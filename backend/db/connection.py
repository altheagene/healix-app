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
    try:
        conn = connect(database)
        print(sql)
        conn.execute("PRAGMA foreign_keys = ON;")
        cursor = conn.cursor()
        cursor.execute(sql, values)
        conn.commit()

        rowcount = cursor.rowcount

        return rowcount > 0

    except Exception as e:
        print("POST error:", e)
        return False
    finally:
        cursor.close()
        conn.close()
