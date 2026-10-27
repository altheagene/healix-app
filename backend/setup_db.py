"""Create an empty clinic database from db/schema.sql and add the first admin account.

Run once on a new machine:  python setup_db.py
"""

import getpass
import os
import sqlite3
import sys

from werkzeug.security import generate_password_hash

from db.connection import database
from roles import ADMIN, ROLES


def main():
    if os.path.exists(database):
        sys.exit(f"{database} already exists. Move it away first if you really want a fresh one.")

    schema = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db", "schema.sql")
    conn = sqlite3.connect(database)
    with open(schema, encoding="utf-8") as f:
        conn.executescript(f.read())
    conn.executemany(
        "INSERT INTO staff_categories (staff_category_id, category_name) VALUES (?, ?)",
        [(role["staff_category_id"], role["category_name"]) for role in ROLES],
    )

    print("Create the first admin account.")
    username = input("Username: ").strip()
    first_name = input("First name: ").strip()
    last_name = input("Last name: ").strip()
    password = getpass.getpass("Password (at least 8 characters): ")
    if not username or not first_name or not last_name or len(password) < 8:
        conn.close()
        os.remove(database)
        sys.exit("Missing details or password too short. Nothing was created.")

    conn.execute(
        """INSERT INTO staff (first_name, last_name, staff_category_id, username, password)
           VALUES (?, ?, ?, ?, ?)""",
        (first_name, last_name, ADMIN, username, generate_password_hash(password)),
    )
    conn.commit()
    conn.close()
    print(f"Created {database} with admin '{username}'.")


if __name__ == "__main__":
    main()
