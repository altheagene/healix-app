"""Supply, batch, and stock queries. This file talks to SQLite and does not know about HTTP."""

from datetime import date, datetime

from db.connection import getprocess, postprocess
from db.dbhelper import addrecord, getall, getmaxid, getrecord, updaterecord


def list_batches(supply_id):
    return getrecord("batches", supply_id=supply_id)


def supply_details(supply_id):
    sql = """
    SELECT s.supply_id, s.supply_name, s.description, c.category_name, s.brand, s.description, s.auto_deduct
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
            COALESCE(SUM(b.stock_level), 0) AS available_stock
        FROM supplies s
        LEFT JOIN batches b
            ON b.supply_id = s.supply_id
            AND b.is_active = 1
        WHERE s.category_id = 1
          AND s.is_active = 1
        GROUP BY s.supply_id, s.supply_name, s.auto_deduct
        HAVING COALESCE(SUM(b.stock_level), 0) > 0;
    """
    return getprocess(sql, [])


def list_inventory_logs(**kwargs):
    values = list(kwargs.values())
    sql = """
        SELECT
        i.inv_id,
        i.inv_date,
        i.batch_id,
        b.batch_number,
        b.expiration_date,
        s.supply_id,
        s.supply_name,
        i.item_in,
        i.item_out
    FROM inventory i
    JOIN batches b ON i.batch_id = b.batch_id
    JOIN supplies s ON b.supply_id = s.supply_id
    WHERE DATE(i.inv_date) BETWEEN ? AND ?
    ORDER BY i.inv_id DESC;

    """
    return getprocess(sql, values)


def list_supplies():
    sql = """
       SELECT
    s.supply_id,
    s.supply_name,
    s.is_active,
    sc.category_name,
    COALESCE(b.total_stock, 0) AS total_stock,
    i.last_updated
FROM supplies s
JOIN supplies_categories sc
    ON sc.category_id = s.category_id

LEFT JOIN (
    SELECT
        supply_id,
        SUM(stock_level) AS total_stock
    FROM batches
    GROUP BY supply_id
) b ON b.supply_id = s.supply_id

LEFT JOIN (
    SELECT
        bt.supply_id,
        MAX(inv.inv_date) AS last_updated
    FROM batches bt
    JOIN inventory inv
        ON inv.batch_id = bt.batch_id
    GROUP BY bt.supply_id
) i ON i.supply_id = s.supply_id

ORDER BY s.supply_name;


            """
    return getprocess(sql, [])


def add_supply(**fields):
    return addrecord("supplies", **fields)


def add_batch(**fields):
    success = addrecord("batches", **fields)
    if success == False:
        return success

    max_batch_id = getmaxid("batches", "batch_id")
    batch_id = max_batch_id[0]["last_id"]
    return addrecord(
        "inventory",
        batch_id=batch_id,
        item_in=fields["stock_level"],
        item_out=0,
        inv_date=date.today(),
    )


def edit_stock_batch(batch_id, item_in, item_out):
    success = addrecord(
        "inventory",
        batch_id=batch_id,
        inv_date=date.today(),
        item_in=item_in,
        item_out=item_out,
    )
    update_value = item_in - item_out
    sql = """
            UPDATE batches
            SET stock_level = stock_level +  ?
            WHERE batch_id = ?
            """
    postprocess(sql, [update_value, batch_id])
    return success


def update_batch(**fields):
    return updaterecord("batches", **fields)


def update_supply(**fields):
    return updaterecord("supplies", **fields)


def refresh_expired_batches():
    try:
        batches = getall("batches")
        datenow = date.today()
        success = True

        for batch in batches:
            print(batch["expiration_date"])
            if batch["expiration_date"] != "":
                exp = batch["expiration_date"]

                if isinstance(exp, str):
                    exp = datetime.strptime(exp, "%Y-%m-%d").date()

                if exp < datenow:
                    updaterecord("batches", batch_id=batch["batch_id"], is_active=False)
    except Exception as e:
        print(e)

    return success
