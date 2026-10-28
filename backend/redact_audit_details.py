"""One-off: strip patient details from audit rows written before the audit log was fixed.

Older rows stored whole request bodies (names, notes, diagnoses). This rewrites them to
the current format, field names and record ids only, then VACUUMs so the old text is
also gone from the file's free pages. Rows already in the new format are left alone, so
it is safe to run more than once.

Run it once on every copy of the database, including production:
    python redact_audit_details.py
"""

import json
import sqlite3

from db.connection import database
from models.audit_model import summarize_payload


def _is_current_format(payload):
    return isinstance(payload, dict) and "fields" in payload and set(payload) <= {"fields", "ids"}


def main():
    conn = sqlite3.connect(database)
    try:
        rows = conn.execute("SELECT audit_id, details FROM audit_logs WHERE details IS NOT NULL").fetchall()
        changed = 0
        with conn:
            for audit_id, details in rows:
                try:
                    payload = json.loads(details)
                except ValueError:
                    payload = None
                if _is_current_format(payload):
                    continue
                # Old rows wrapped non-object bodies as {"value": ...}.
                if isinstance(payload, dict) and set(payload) == {"value"}:
                    payload = payload["value"]
                summary = summarize_payload(payload)
                conn.execute(
                    "UPDATE audit_logs SET details = ? WHERE audit_id = ?",
                    (json.dumps(summary) if summary is not None else None, audit_id),
                )
                changed += 1
        # UPDATE leaves the old text in free pages and the WAL; clear both.
        conn.execute("VACUUM")
        conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        print(f"Redacted {changed} of {len(rows)} audit rows in {database}.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
