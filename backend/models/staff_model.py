"""Staff queries. This file talks to the database and does not know about HTTP."""

from db.connection import getprocess, postprocess
from db.dbhelper import addrecord, getrecord, updaterecord
from passwords import hash_password
from roles import ROLES, role_name


def find_staff(staff_id):
    rows = getrecord("staff", staff_id=staff_id)
    for row in rows:
        row.pop("password", None)
        row.pop("token_version", None)
    return rows


def list_staff_categories():
    return [dict(role) for role in ROLES]


def _attach_role(rows):
    for row in rows:
        row["category_name"] = role_name(row.get("staff_category_id"))
    return rows


def list_staff_with_categories():
    sql = """
            SELECT
            s.staff_id,
            s.first_name,
            s.middle_name,
            s.last_name,
            s.staff_category_id,
            s.birthday,
            s.sex,
            s.phone,
            s.email,
            s.username
            FROM staff s
            """
    return _attach_role(getprocess(sql, []))


def find_user_by_username(username):
    sql = """
        SELECT * FROM staff
        WHERE username = ?
    """
    return _attach_role(getprocess(sql, [username]))


def add_staff(**fields):
    if fields.get("password"):
        fields["password"] = hash_password(fields["password"])
    return addrecord("staff", **fields)


def update_staff(**fields):
    # Passwords change only through /resetpassword, which checks the current one.
    fields.pop("password", None)
    return updaterecord("staff", **fields)


def ensure_session_column():
    """Adds staff.token_version. Raising it ends every session that staff member has open."""
    columns = [row["name"] for row in getprocess("PRAGMA table_info(staff)", [])]
    if "token_version" not in columns:
        postprocess("ALTER TABLE staff ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0", [])


def get_session_staff(staff_id):
    rows = getprocess(
        "SELECT staff_id, username, staff_category_id, token_version FROM staff WHERE staff_id = ?",
        [staff_id],
    )
    return rows[0] if rows else None


def end_sessions(staff_id):
    return postprocess(
        "UPDATE staff SET token_version = token_version + 1 WHERE staff_id = ?",
        [staff_id],
    )
