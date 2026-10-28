"""Hash staff passwords. Plain text is only accepted long enough to upgrade old rows."""

from werkzeug.security import check_password_hash, generate_password_hash

from db.connection import getprocess
from db.dbhelper import updaterecord


MIN_PASSWORD_LENGTH = 8

# The passwords attackers try first. Not exhaustive, just the obvious ones.
COMMON_PASSWORDS = {
    "password", "password1", "password123", "passw0rd", "12345678", "123456789",
    "1234567890", "qwerty123", "qwertyuiop", "iloveyou", "admin123", "administrator",
    "welcome1", "letmein1", "abc12345", "11111111", "00000000", "healix123",
    "clinic123", "nurse123", "doctor123", "changeme", "sunshine", "princess",
}


def password_problem(password, username=None):
    """Return why a new password is not acceptable, or None if it is fine."""
    if not password or len(password) < MIN_PASSWORD_LENGTH:
        return f"Password must be at least {MIN_PASSWORD_LENGTH} characters"
    lowered = password.lower()
    if lowered in COMMON_PASSWORDS or (username and lowered == str(username).lower()):
        return "That password is too easy to guess. Choose a different one."
    return None


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
