"""Hash staff passwords. Plain text is only accepted long enough to upgrade old rows."""

from werkzeug.security import check_password_hash, generate_password_hash

from db.connection import getprocess
from db.dbhelper import updaterecord


def hash_password(password):
    return generate_password_hash(password)


def password_matches(stored, password):
    if not stored or not password:
        return False
    if _is_hashed(stored):
        return check_password_hash(stored, password)
    return stored == password


def _is_hashed(stored):
    return stored.startswith(("pbkdf2:", "scrypt:"))


def upgrade_plaintext_passwords():
    rows = getprocess("SELECT staff_id, password FROM staff", [])
    for row in rows:
        stored = row.get("password") or ""
        if stored and not _is_hashed(stored):
            updaterecord(
                "staff",
                staff_id=row["staff_id"],
                password=hash_password(stored),
            )
