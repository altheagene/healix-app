"""Copy the clinic database to backups/ and keep the most recent copies.

Safe to run while the server is running: it uses SQLite's online backup.
Run it daily, e.g. from Windows Task Scheduler or cron:  python backup_db.py
"""

import os
import sqlite3
import sys
from datetime import datetime

from db.connection import database

KEEP = int(os.environ.get("HEALIX_BACKUPS_TO_KEEP", "14"))
BACKUP_DIR = os.environ.get(
    "HEALIX_BACKUP_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups")
)


def main():
    if not os.path.exists(database):
        sys.exit(f"No database at {database}")
    os.makedirs(BACKUP_DIR, exist_ok=True)

    target = os.path.join(BACKUP_DIR, f"clinic-{datetime.now():%Y%m%d-%H%M%S}.db")
    source = sqlite3.connect(database)
    copy = sqlite3.connect(target)
    try:
        source.backup(copy)
    finally:
        copy.close()
        source.close()
    print("Backed up to", target)

    backups = sorted(f for f in os.listdir(BACKUP_DIR) if f.startswith("clinic-") and f.endswith(".db"))
    for old in backups[:-KEEP]:
        os.remove(os.path.join(BACKUP_DIR, old))
        print("Removed old backup", old)


if __name__ == "__main__":
    main()
