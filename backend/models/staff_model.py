"""Staff queries. This file talks to the database and does not know about HTTP."""

from db.connection import getprocess
from db.dbhelper import addrecord, getrecord, updaterecord
from passwords import hash_password


def find_staff(staff_id):
    rows = getrecord("staff", staff_id=staff_id)
    for row in rows:
        row.pop("password", None)
    return rows


def list_staff_categories():
    sql = """
        SELECT staff_category_id, category_name
        FROM staff_categories
    """
    return getprocess(sql, [])


def list_staff_with_categories():
    sql = """
            SELECT
            s.staff_id,
            s.first_name,
            s.middle_name,
            s.last_name,
            s.staff_category_id,
            s.birthday,
            sc.category_name,
            s.sex,
            s.phone,
            s.email,
            s.username
            FROM staff s
            JOIN staff_categories sc
            ON s.staff_category_id = sc.staff_category_id;
            """
    return getprocess(sql, [])


def find_user_by_username(username):
    sql = """
        SELECT s.* , sc.category_name from staff s
        JOIN staff_categories sc ON s.staff_category_id = sc.staff_category_id
        WHERE s.username = ?
    """
    return getprocess(sql, [username])


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
