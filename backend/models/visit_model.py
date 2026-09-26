"""Visit and medication queries. This file talks to SQLite and does not know about HTTP."""

from datetime import date
from sqlite3 import connect

from db.connection import database, getprocess
from db.dbhelper import deleterecord, getmaxid, updaterecord


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
            s.supply_id,
            s.supply_name,
            s.auto_deduct,
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
    keys = list(fields.keys())
    values = list(fields.values())
    columns = "`,`".join(keys)
    placeholders = ",".join(["?"] * len(values))
    sql = f"INSERT INTO visit_logs (`{columns}`) VALUES ({placeholders})"

    conn = _connect()
    cursor = conn.cursor()
    try:
        cursor.execute(sql, values)
        visit_id = cursor.lastrowid
        conn.commit()
        return visit_id
    except Exception as error:
        print("POST error:", error)
        conn.rollback()
        return None
    finally:
        conn.close()


def latest_visit_id():
    return getmaxid("visit_logs", "visit_id")


def add_medications_for_visit(visit_id, medications):
    conn = _connect()
    cursor = conn.cursor()
    try:
        _insert_medications(cursor, visit_id, medications or [])
        conn.commit()
        return True
    except Exception as error:
        print("POST error:", error)
        conn.rollback()
        return False
    finally:
        conn.close()


def replace_visit_medications(visit_id, medications):
    conn = _connect()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT m.supply_id, m.quantity, s.auto_deduct
            FROM medication_details m
            JOIN supplies s ON s.supply_id = m.supply_id
            WHERE m.visit_id = ?
            """,
            (visit_id,),
        )
        previous = cursor.fetchall()
        for supply_id, quantity, auto_deduct in previous:
            if auto_deduct and quantity:
                _change_stock(cursor, supply_id, quantity, "in")

        cursor.execute(
            "DELETE FROM medication_details WHERE visit_id = ?",
            (visit_id,),
        )
        _insert_medications(cursor, visit_id, medications or [])
        conn.commit()
        return True
    except Exception as error:
        print("POST error:", error)
        conn.rollback()
        return False
    finally:
        conn.close()


def _connect():
    conn = connect(database)
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def _insert_medications(cursor, visit_id, medications):
    for med in medications:
        supply_id = med.get("supply_id")
        if supply_id in (None, ""):
            continue
        supply_id = int(supply_id)
        quantity = int(med.get("quantity") or 0)
        cursor.execute(
            """
            INSERT INTO medication_details (visit_id, supply_id, quantity)
            VALUES (?, ?, ?)
            """,
            (visit_id, supply_id, quantity),
        )
        if _supply_auto_deducts(cursor, supply_id) and quantity > 0:
            _change_stock(cursor, supply_id, quantity, "out")


def _supply_auto_deducts(cursor, supply_id):
    cursor.execute(
        "SELECT auto_deduct FROM supplies WHERE supply_id = ?",
        (supply_id,),
    )
    row = cursor.fetchone()
    return bool(row and row[0])


def _change_stock(cursor, supply_id, quantity, direction):
    quantity = int(quantity or 0)
    if quantity <= 0:
        return

    if direction == "out":
        cursor.execute(
            """
            SELECT batch_id, stock_level
            FROM batches
            WHERE supply_id = ? AND stock_level > 0 AND is_active = true
            ORDER BY expiration_date ASC
            """,
            (supply_id,),
        )
        remaining = quantity
        for batch_id, stock in cursor.fetchall():
            if remaining <= 0:
                break
            take = min(stock, remaining)
            cursor.execute(
                """
                UPDATE batches
                SET stock_level = stock_level - ?
                WHERE batch_id = ?
                """,
                (take, batch_id),
            )
            cursor.execute(
                """
                INSERT INTO inventory (inv_date, batch_id, item_in, item_out)
                VALUES (?, ?, ?, ?)
                """,
                (date.today(), batch_id, 0, take),
            )
            remaining -= take
        if remaining > 0:
            print(
                f"Warning: Not enough stock for supply_id {supply_id}, {remaining} remaining!"
            )
        return

    cursor.execute(
        """
        SELECT batch_id
        FROM batches
        WHERE supply_id = ? AND is_active = true
        ORDER BY expiration_date ASC
        LIMIT 1
        """,
        (supply_id,),
    )
    row = cursor.fetchone()
    if not row:
        print(f"Warning: No active batch to restore supply_id {supply_id}")
        return

    batch_id = row[0]
    cursor.execute(
        """
        UPDATE batches
        SET stock_level = stock_level + ?
        WHERE batch_id = ?
        """,
        (quantity, batch_id),
    )
    cursor.execute(
        """
        INSERT INTO inventory (inv_date, batch_id, item_in, item_out)
        VALUES (?, ?, ?, ?)
        """,
        (date.today(), batch_id, quantity, 0),
    )


def update_visit_log(**fields):
    return updaterecord("visit_logs", **fields)


def delete_visit_medications(visit_id):
    return deleterecord("medication_details", visit_id=visit_id)
