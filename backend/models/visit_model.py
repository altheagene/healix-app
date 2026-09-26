"""Visit and medication queries. This file talks to SQLite and does not know about HTTP."""

from datetime import date
from sqlite3 import connect

from db.connection import database, getprocess
from db.dbhelper import addrecord, deleterecord, getmaxid, updaterecord


def get_clinic_visits(**kwargs):
    values = list(kwargs.values())
    sql = """
        SELECT
                v.visit_id,
                v.visit_datetime,
                v.notes,
                s.service_id,
                s.service_name,
                p.patient_id,
                p.first_name || ' ' || p.middle_name || ' ' || p.last_name AS patient_name,
                st.staff_id,
                st.first_name || ' ' || st.last_name AS staff_name
            FROM visit_logs v
            JOIN services s ON v.service_id = s.service_id
            JOIN patients p ON v.patient_id = p.patient_id
            JOIN staff st ON v.staff_id = st.staff_id
            WHERE DATE(v.visit_datetime) BETWEEN ? AND ?
            ORDER BY v.visit_datetime;
            """
    return getprocess(sql, values)


def get_patient_clinic_logs(**kwargs):
    values = list(kwargs.values())
    sql = """
        SELECT
                v.visit_id,
                v.visit_datetime,
                v.notes,
                s.service_id,
                v.Weight,
                v.Temperature,
                s.service_name,
                p.patient_id,
                p.first_name || ' ' || p.middle_name || ' ' || p.last_name AS patient_name,
                st.staff_id,
                st.first_name || ' ' || st.last_name AS staff_name
            FROM visit_logs v
            JOIN services s ON v.service_id = s.service_id
            JOIN patients p ON v.patient_id = p.patient_id
            JOIN staff st ON v.staff_id = st.staff_id
            WHERE p.patient_id  = ?
            ORDER BY v.visit_datetime;
            """
    return getprocess(sql, values)


def get_medication_details(**kwargs):
    values = list(kwargs.values())
    sql = """
            SELECT
            s.supply_name,
            m.quantity
            FROM medication_details m
            JOIN supplies s on s.supply_id = m.supply_id
            WHERE visit_id = ?
            """
    return getprocess(sql, values)


def get_visit_logs():
    sql = """
        SELECT
            v.visit_id,
            v.visit_datetime,
            v.notes,
            v.Weight,
            v.Temperature,
            s.service_name,
            p.first_name || ' ' || p.middle_name || ' ' || p.last_name AS patient_name,
            st.first_name || ' ' || st.last_name AS staff_name
        FROM visit_logs v
        JOIN services s ON v.service_id = s.service_id
        JOIN patients p ON v.patient_id = p.patient_id
        JOIN staff st ON v.staff_id = st.staff_id
        ORDER BY v.visit_datetime DESC
    """
    return getprocess(sql, [])


def add_visit_log(**fields):
    return addrecord("visit_logs", **fields)


def latest_visit_id():
    return getmaxid("visit_logs", "visit_id")


def add_medication_detail(visit_id, supply_id, quantity):
    return addrecord(
        "medication_details",
        visit_id=visit_id,
        supply_id=supply_id,
        quantity=quantity,
    )


def deduct_batch(supply_id, quantity):
    conn = connect(database)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT batch_id, stock_level
        FROM batches
        WHERE supply_id = ? AND stock_level > 0 AND is_active = true
        ORDER BY expiration_date ASC
    """, (supply_id,))

    batches = cursor.fetchall()
    remaining = quantity

    for batch_id, stock in batches:
        cursor = conn.cursor()
        if remaining <= 0:
            break
        take = min(stock, remaining)
        cursor.execute("""
            UPDATE batches
            SET stock_level = stock_level - ?
            WHERE batch_id = ?
        """, (take, batch_id))
        remaining -= take

        cursor.execute("""
            INSERT INTO inventory (inv_date, batch_id, item_in, item_out)
            VALUES (?, ?, ?, ?)
        """, (date.today(), batch_id, 0, take))

    if remaining > 0:
        print(f"Warning: Not enough stock for supply_id {supply_id}, {remaining} remaining!")

    conn.commit()
    cursor.close()
    conn.close()


def update_visit_log(**fields):
    return updaterecord("visit_logs", **fields)


def delete_visit_medications(visit_id):
    return deleterecord("medication_details", visit_id=visit_id)
