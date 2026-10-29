import csv
import io
from datetime import date, timedelta

TODAY = date.today()
SOON = (TODAY + timedelta(days=20)).isoformat()
LATER = (TODAY + timedelta(days=200)).isoformat()
PAST = (TODAY - timedelta(days=3)).isoformat()
VISIT = {"patient_id": 1, "service_id": 1, "staff_id": 3, "visit_datetime": "2026-10-01 09:00:00"}


def _batch(db, batch_id, number, expiry, stock, active=1):
    db.execute(
        "INSERT INTO batches (batch_id, supply_id, batch_number, expiration_date, stock_level, is_active)"
        " VALUES (?, 1, ?, ?, ?, ?)",
        (batch_id, number, expiry, stock, active),
    )
    db.commit()


def _log(db):
    # inventory.batch_id is a TEXT column in the original schema, hence the cast.
    return [dict(zip(("batch_id", "item_in", "item_out", "reason", "staff_id", "visit_id", "note"), row))
            for row in db.execute("SELECT CAST(batch_id AS INTEGER), item_in, item_out, reason, staff_id, visit_id,"
                                  " note FROM inventory ORDER BY inv_id")]


def test_staff_can_see_stock_but_not_change_it(client, headers):
    staff = headers("staff")
    assert client.get("/getallsupplies", headers=staff).status_code == 200
    assert client.get("/getinventoryalerts", headers=staff).status_code == 200
    for path, body in [("/editstockbatch", {"batch_id": 1, "item_in": 1, "reason": "restock"}),
                       ("/additem", {"supply_name": "Gauze", "category_id": 1}),
                       ("/disposebatch", {"batch_id": 1, "reason": "damaged"})]:
        assert client.post(path, headers=staff, json=body).status_code == 403, path


def test_stock_change_records_reason_staff_and_note(client, headers, db):
    nurse = headers("nurse")
    body = {"batch_id": 1, "item_out": 2, "reason": "damaged", "note": "Dropped on the floor"}
    assert client.post("/editstockbatch", headers=nurse, json=body).json == {"success": True}
    assert _log(db) == [{"batch_id": 1, "item_in": 0, "item_out": 2, "reason": "damaged", "staff_id": 2,
                         "visit_id": None, "note": "Dropped on the floor"}]
    assert db.execute("SELECT created_at FROM inventory").fetchone()[0].startswith(TODAY.isoformat())


def test_stock_change_reason_must_fit_the_direction(client, headers, db):
    nurse = headers("nurse")
    assert client.post("/editstockbatch", headers=nurse, json={"batch_id": 1, "item_in": 3}).status_code == 400
    bad = {"batch_id": 1, "item_in": 3, "reason": "damaged"}  # damage never adds stock
    assert client.post("/editstockbatch", headers=nurse, json=bad).status_code == 400
    both = {"batch_id": 1, "item_in": 3, "item_out": 1, "reason": "restock"}
    assert client.post("/editstockbatch", headers=nurse, json=both).status_code == 400
    assert db.execute("SELECT stock_level FROM batches WHERE batch_id = 1").fetchone()[0] == 10


def test_new_batch_records_its_source(client, headers, db):
    body = {"supply_id": 1, "batch_number": "D-1", "expiration_date": LATER, "stock_level": 30, "reason": "donation"}
    assert client.post("/addbatch", headers=headers("nurse"), json=body).json == {"success": True}
    assert _log(db)[-1]["reason"] == "donation" and _log(db)[-1]["staff_id"] == 2


def test_dispensing_uses_the_batch_that_expires_first(client, headers, db):
    db.execute("UPDATE batches SET expiration_date = ? WHERE batch_id = 1", (LATER,))
    db.commit()
    _batch(db, 2, "NO-EXPIRY", "", 10)
    _batch(db, 3, "SOON", SOON, 2)
    body = {**VISIT, "medications": [{"supply_id": 1, "quantity": 5}]}
    visit_id = client.post("/addvisitlog", headers=headers("nurse"), json=body).json["visit_id"]
    stock = dict(db.execute("SELECT batch_number, stock_level FROM batches").fetchall())
    assert stock == {"B-1": 7, "NO-EXPIRY": 10, "SOON": 0}
    assert [(row["batch_id"], row["item_out"], row["reason"], row["visit_id"], row["staff_id"]) for row in _log(db)] == [
        (3, 2, "dispensed", visit_id, 2), (1, 3, "dispensed", visit_id, 2)]


def test_giving_more_than_is_in_stock_saves_nothing(client, headers, db):
    body = {**VISIT, "medications": [{"supply_id": 1, "quantity": 11}]}
    response = client.post("/addvisitlog", headers=headers("nurse"), json=body)
    assert response.status_code == 400
    assert response.json["error"] == "Only 10 of Paracetamol left in stock"
    assert db.execute("SELECT COUNT(*) FROM visit_logs").fetchone()[0] == 0
    assert db.execute("SELECT stock_level FROM batches WHERE batch_id = 1").fetchone()[0] == 10


def test_editing_a_visit_logs_the_return_then_the_new_dispense(client, headers, db):
    nurse = headers("nurse")
    visit_id = client.post("/addvisitlog", headers=nurse, json={**VISIT, "medications": [{"supply_id": 1, "quantity": 10}]}).json["visit_id"]
    # All 10 are out, yet changing the visit to 4 works: the 10 come back first.
    body = {"visit_id": visit_id, "medications": [{"supply_id": 1, "quantity": 4}]}
    assert client.post("/updatevisitlog", headers=nurse, json=body).json == {"success": True}
    assert [row["reason"] for row in _log(db)] == ["dispensed", "returned", "dispensed"]
    assert db.execute("SELECT stock_level FROM batches WHERE batch_id = 1").fetchone()[0] == 6


def test_alerts_list_expiring_expired_and_reorder(client, headers, db):
    db.execute("UPDATE batches SET expiration_date = ? WHERE batch_id = 1", (SOON,))
    db.commit()
    _batch(db, 2, "OLD", PAST, 4, active=0)
    _batch(db, 3, "EMPTY-OLD", PAST, 0, active=0)
    alerts = client.get("/getinventoryalerts?days=30", headers=headers("staff")).json
    assert [b["batch_number"] for b in alerts["expiring"]] == ["B-1"]
    assert [b["batch_number"] for b in alerts["to_dispose"]] == ["OLD"]
    assert [s["supply_name"] for s in alerts["reorder"]] == ["Paracetamol"]  # 10 is under the default 20
    assert client.get("/getinventoryalerts?days=10", headers=headers("staff")).json["expiring"] == []


def test_reorder_level_and_unit_per_item(client, headers):
    nurse = headers("nurse")
    body = {"supply_id": 1, "unit": " tablets ", "reorder_level": 5}
    assert client.post("/updatesupply", headers=nurse, json=body).json == {"success": True}
    item = client.get("/getallsupplies", headers=nurse).json[0]
    assert (item["unit"], item["reorder_level"], item["needs_reorder"]) == ("tablets", 5, False)
    assert client.post("/updatesupply", headers=nurse, json={"supply_id": 1, "reorder_level": -1}).status_code == 400


def test_dispose_takes_the_rest_off_the_shelf_and_logs_it(client, headers, db):
    _batch(db, 2, "OLD", PAST, 4, active=0)
    body = {"batch_id": 2, "reason": "expired"}
    assert client.post("/disposebatch", headers=headers("nurse"), json=body).json == {"success": True}
    assert tuple(db.execute("SELECT stock_level, is_active FROM batches WHERE batch_id = 2").fetchone()) == (0, 0)
    assert _log(db)[-1]["item_out"] == 4 and _log(db)[-1]["reason"] == "expired"
    assert client.get("/getinventoryalerts", headers=headers("nurse")).json["to_dispose"] == []
    assert client.post("/disposebatch", headers=headers("nurse"), json={"batch_id": 1, "reason": "used"}).status_code == 400


def test_stock_cannot_be_set_without_a_log_entry(client, headers, db):
    nurse = headers("nurse")
    client.post("/editbatch", headers=nurse, json={"batch_id": 1, "batch_number": "B-1", "stock_level": 999})
    client.post("/updatesupply", headers=nurse, json={"supply_id": 1, "supply_name": "Paracetamol", "is_active": 1})
    assert db.execute("SELECT stock_level FROM batches WHERE batch_id = 1").fetchone()[0] == 10


def test_inventory_csv_has_reason_and_who(client, headers):
    nurse = headers("nurse")
    client.post("/editstockbatch", headers=nurse, json={"batch_id": 1, "item_in": 5, "reason": "donation"})
    response = client.get(f"/download/inventorylogs?fromdate={TODAY}&todate={TODAY}", headers=nurse)
    rows = list(csv.reader(io.StringIO(response.get_data(as_text=True))))
    header = rows[0]
    assert rows[1][header.index("Reason")] == "Donated"
    assert rows[1][header.index("Recorded by")] == "Test nurse"
    assert client.get("/getinvlogs?fromdate=nope&todate=x", headers=nurse).status_code == 400
