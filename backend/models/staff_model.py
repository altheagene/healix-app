"""Staff queries. This file talks to the database and does not know about HTTP."""

from db.connection import getprocess
from db.dbhelper import addrecord, getrecord, updaterecord


def find_staff(staff_id):
    return getrecord("staff", staff_id=staff_id)


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


def validate_user(**credentials):
    keys = list(credentials.keys())
    values = list(credentials.values())

    sql = f"""
        SELECT s.* , sc.category_name from staff s
        JOIN staff_categories sc ON s.staff_category_id = sc.staff_category_id
        WHERE `{keys[0]}` = ? AND `{keys[1]}` = ?

    """
    return getprocess(sql, values)


def add_staff(**fields):
    return addrecord("staff", **fields)


def update_staff(**fields):
    return updaterecord("staff", **fields)
