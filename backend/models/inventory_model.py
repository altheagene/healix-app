"""Supply, batch, and stock queries. This file talks to SQLite and does not know about HTTP.

Every change to a batch's stock goes through move_stock, which writes the change and its
log row (reason, who, when) in the same transaction, so the log always explains the count."""

from datetime import date, datetime, timedelta
from sqlite3 import connect

from db.connection import REJECTED_WRITE, database, getprocess, postprocess
from db.dbhelper import addrecord, checked_columns, getall, updaterecord

# Must match app/inventory.ts.
STOCK_IN_REASONS = {
    "restock": "Restocked",
    "donation": "Donated",
    "correction": "Count correction",
}
STOCK_OUT_REASONS = {
    "used": "Used in the clinic",
    "damaged": "Damaged or lost",
    "expired": "Expired, disposed",
    "correction": "Count correction",
}
# Written by the system, never chosen in a form.
SYSTEM_REASONS = {
    "dispensed": "Given at a visit",
    "returned": "Returned from an edited visit",
}
REASONS = {**STOCK_IN_REASONS, **STOCK_OUT_REASONS, **SYSTEM_REASONS}
DISPOSE_REASONS = ("expired", "damaged")

# Until a nurse sets an item's own level, it needs reordering at this count or below.
DEFAULT_REORDER_LEVEL = 20

# Batches without an expiry date are used last, so stock that can expire goes first.
FIRST_TO_EXPIRE = "(expiration_date IS NULL OR expiration_date = ''), expiration_date, batch_id"


def _now():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def log_movement(cursor, batch_id, item_in, item_out, reason, staff_id=None, visit_id=None, note=None):
    cursor.execute(
        """
        INSERT INTO inventory (inv_date, created_at, batch_id, item_in, item_out, reason, note, staff_id, visit_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (date.today().isoformat(), _now(), batch_id, int(item_in), int(item_out), reason, note, staff_id, visit_id),
    )


def list_batches(supply_id):
    return getprocess(
        """
        SELECT b.*, (SELECT MAX(coalesce(i.created_at, i.inv_date)) FROM inventory i
                     WHERE i.batch_id = b.batch_id) AS last_updated
        FROM batches b
        WHERE b.supply_id = ?
        ORDER BY b.is_active DESC, (b.expiration_date IS NULL OR b.expiration_date = ''), b.expiration_date
        """,
        [supply_id],
    )


def supply_details(supply_id):
    sql = """
    SELECT s.supply_id, s.supply_name, s.description, c.category_name, s.brand, s.auto_deduct,
           s.unit, s.reorder_level
    FROM supplies s
    INNER JOIN supplies_categories c on  s.category_id = c.category_id
    WHERE s.supply_id = ?
    """
    return getprocess(sql, [supply_id])


def list_supply_categories():
    return getall("supplies_categories")


def list_medicine():
    sql = """
        SELECT
            s.supply_id,
            s.supply_name,
            s.auto_deduct,
            s.unit,
            COALESCE(SUM(b.stock_level), 0) AS available_stock
        FROM supplies s
        LEFT JOIN batches b
            ON b.supply_id = s.supply_id
            AND b.is_active = 1
        WHERE s.category_id = 1
          AND s.is_active = 1
        GROUP BY s.supply_id, s.supply_name, s.auto_deduct, s.unit
        HAVING COALESCE(SUM(b.stock_level), 0) > 0;
    """
    return getprocess(sql, [])


def list_inventory_logs(from_date, to_date):
    sql = """
        SELECT
            i.inv_id, i.inv_date, coalesce(i.created_at, i.inv_date) AS moved_at,
            i.batch_id, b.batch_number, b.expiration_date,
            s.supply_id, s.supply_name, s.unit,
            i.item_in, i.item_out, i.reason, i.note, i.visit_id,
            trim(coalesce(st.first_name, '') || ' ' || coalesce(st.last_name, '')) AS staff_name
        FROM inventory i
        JOIN batches b ON i.batch_id = b.batch_id
        JOIN supplies s ON b.supply_id = s.supply_id
        LEFT JOIN staff st ON st.staff_id = i.staff_id
        WHERE DATE(i.inv_date) BETWEEN ? AND ?
        ORDER BY i.inv_id DESC
    """
    return getprocess(sql, [from_date, to_date])


def list_supplies():
    sql = """
        SELECT
            s.supply_id, s.supply_name, s.is_active, s.unit, s.reorder_level,
            sc.category_name,
            COALESCE(b.total_stock, 0) AS total_stock,
            b.nearest_expiry,
            i.last_updated
        FROM supplies s
        JOIN supplies_categories sc ON sc.category_id = s.category_id
        LEFT JOIN (
            SELECT supply_id, SUM(stock_level) AS total_stock,
                   MIN(CASE WHEN stock_level > 0 AND expiration_date != '' THEN expiration_date END)
                       AS nearest_expiry
            FROM batches
            WHERE is_active = 1
            GROUP BY supply_id
        ) b ON b.supply_id = s.supply_id
        LEFT JOIN (
            SELECT bt.supply_id, MAX(coalesce(inv.created_at, inv.inv_date)) AS last_updated
            FROM batches bt
            JOIN inventory inv ON inv.batch_id = bt.batch_id
            GROUP BY bt.supply_id
        ) i ON i.supply_id = s.supply_id
        ORDER BY s.supply_name
    """
    rows = getprocess(sql, [])
    for row in rows:
        row["needs_reorder"] = row["total_stock"] <= _reorder_level(row)
    return rows


def _reorder_level(row):
    level = row.get("reorder_level")
    return DEFAULT_REORDER_LEVEL if level is None else level


def inventory_alerts(days=60):
    """What needs the nurse's attention: stock that expires within `days`, expired
    stock still waiting to be disposed of, and items at or below their reorder level."""
    today = date.today()
    batch_columns = """
        b.batch_id, b.batch_number, b.expiration_date, b.stock_level,
        s.supply_id, s.supply_name, s.unit
    """
    expiring = getprocess(
        f"""
        SELECT {batch_columns} FROM batches b JOIN supplies s ON s.supply_id = b.supply_id
        WHERE b.is_active = 1 AND s.is_active = 1 AND b.stock_level > 0
          AND b.expiration_date != '' AND b.expiration_date BETWEEN ? AND ?
        ORDER BY b.expiration_date
        """,
        [today.isoformat(), (today + timedelta(days=days)).isoformat()],
    )
    # Expired batches are switched off so their stock is never given out, but the
    # units are still on the shelf until someone disposes of them and logs it.
    to_dispose = getprocess(
        f"""
        SELECT {batch_columns} FROM batches b JOIN supplies s ON s.supply_id = b.supply_id
        WHERE b.stock_level > 0 AND b.expiration_date != '' AND b.expiration_date < ?
        ORDER BY b.expiration_date
        """,
        [today.isoformat()],
    )
    reorder = [row for row in list_supplies() if row["is_active"] and row["needs_reorder"]]
    return {"days": days, "expiring": expiring, "to_dispose": to_dispose, "reorder": reorder}


def add_supply(**fields):
    return addrecord("supplies", **fields)


def add_batch(reason="restock", staff_id=None, note=None, **fields):
    """Saves the batch and logs its opening stock, together or not at all."""
    try:
        columns = list(checked_columns("batches", list(fields)))
    except ValueError as e:
        print("POST error:", e)
        return False
    conn = _connect()
    try:
        with conn:
            cursor = conn.cursor()
            cursor.execute(
                f"INSERT INTO batches (`{'`,`'.join(columns)}`) VALUES ({','.join('?' * len(columns))})",
                [fields[column] for column in columns],
            )
            log_movement(cursor, cursor.lastrowid, fields["stock_level"], 0, reason, staff_id, note=note)
    except REJECTED_WRITE as e:
        print("Write refused:", e)
        return False
    finally:
        conn.close()
    expire_batches()
    return True


def move_stock(batch_id, item_in, item_out, reason, staff_id=None, note=None):
    """Changes the batch's stock and logs why, together or not at all. Refuses an
    unknown batch, or removing more stock than the batch holds."""
    change = int(item_in) - int(item_out)
    conn = _connect()
    try:
        with conn:  # commits on success, rolls back on any error
            cursor = conn.cursor()
            updated = cursor.execute(
                "UPDATE batches SET stock_level = stock_level + ? WHERE batch_id = ? AND stock_level + ? >= 0",
                (change, batch_id, change),
            ).rowcount
            if updated != 1:
                return False
            log_movement(cursor, batch_id, item_in, item_out, reason, staff_id, note=note)
        return True
    except REJECTED_WRITE as e:
        print("Write refused:", e)
        return False
    finally:
        conn.close()


def edit_stock_batch(batch_id, item_in, item_out, reason="correction", staff_id=None, note=None):
    return move_stock(batch_id, item_in, item_out, reason, staff_id, note)


def dispose_batch(batch_id, reason, staff_id=None, note=None):
    """Takes everything left in the batch off the shelf, logged, and switches it off."""
    conn = _connect()
    try:
        with conn:
            cursor = conn.cursor()
            row = cursor.execute("SELECT stock_level FROM batches WHERE batch_id = ?", (batch_id,)).fetchone()
            if not row:
                return False
            if row[0] > 0:
                log_movement(cursor, batch_id, 0, row[0], reason, staff_id, note=note)
            cursor.execute("UPDATE batches SET stock_level = 0, is_active = 0 WHERE batch_id = ?", (batch_id,))
        return True
    except REJECTED_WRITE as e:
        print("Write refused:", e)
        return False
    finally:
        conn.close()


def update_batch(**fields):
    updated = updaterecord("batches", **fields)
    expire_batches()  # in case the new expiry date is already past
    return updated


def update_supply(**fields):
    return updaterecord("supplies", **fields)


def expire_batches():
    """Switches off batches past their expiry date, so their stock is never given out.
    The stock stays on the batch, so it shows as waiting to be disposed of.
    Runs once a day on the server and after any batch is added or edited."""
    return postprocess(
        """
        UPDATE batches SET is_active = 0
        WHERE is_active = 1
          AND expiration_date IS NOT NULL AND expiration_date != ''
          AND expiration_date < ?
        """,
        [date.today().isoformat()],
    )


def _connect():
    conn = connect(database)
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn
