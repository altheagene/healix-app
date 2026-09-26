"""Staff queries. This file talks to the database and does not know about HTTP."""

from db.connection import getprocess
from db.dbhelper import addrecord, getrecord, updaterecord
from passwords import hash_password
from roles import ROLES, role_name


def find_staff(staff_id):
    rows = getrecord("staff", staff_id=staff_id)
    for row in rows:
        row.pop("password", None)
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
    if fields.get("password"):
        fields["password"] = hash_password(fields["password"])
    else:
        fields.pop("password", None)
    return updaterecord("staff", **fields)
