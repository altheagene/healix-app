from test_db_writes import NEW_PATIENT


def test_missing_patient_fields_are_named(client, headers):
    body = {k: v for k, v in NEW_PATIENT.items() if k not in ("birthday", "sex")}
    response = client.post("/addpatient", headers=headers("staff"), json=body)
    assert response.status_code == 400
    assert response.json["error"] == "Missing required fields: birthday, sex"


def test_bad_birthday_is_refused(client, headers):
    response = client.post("/addpatient", headers=headers("staff"), json={**NEW_PATIENT, "birthday": "31/01/2005"})
    assert response.status_code == 400
    assert "birthday" in response.json["error"]


def test_negative_stock_movement_is_refused(client, headers, db):
    response = client.post("/editstockbatch", headers=headers("staff"), json={"batch_id": 1, "item_in": -5, "item_out": 0})
    assert response.status_code == 400
    assert db.execute("SELECT stock_level FROM batches WHERE batch_id = 1").fetchone()[0] == 10


def test_cannot_remove_more_stock_than_the_batch_holds(client, headers, db):
    response = client.post("/editstockbatch", headers=headers("staff"), json={"batch_id": 1, "item_in": 0, "item_out": 11})
    assert response.json == {"success": False}
    assert db.execute("SELECT stock_level FROM batches WHERE batch_id = 1").fetchone()[0] == 10


def test_batch_needs_a_whole_number_of_stock(client, headers):
    body = {"supply_id": 1, "batch_number": "B-9", "stock_level": "lots"}
    assert client.post("/addbatch", headers=headers("staff"), json=body).status_code == 400


def test_missing_field_gives_400_not_500(client, headers):
    body = {"staff_id": 2, "staff_category_id": 2}  # no names, phone, email or username
    response = client.post("/updatestaff", headers=headers("nurse"), json=body)
    assert response.status_code == 400
    assert response.json["error"].startswith("Missing required field")


VISIT = {"patient_id": 1, "service_id": 1, "staff_id": 3, "visit_datetime": "2026-10-01 09:00:00", "notes": "fever"}


def test_visit_and_medicines_save_together_and_deduct_stock(client, headers, db):
    body = {**VISIT, "medications": [{"supply_id": 1, "quantity": 3}, {"supply_id": "", "quantity": 0}]}
    response = client.post("/addvisitlog", headers=headers("nurse"), json=body)
    visit_id = response.json["visit_id"]
    assert [tuple(r) for r in db.execute("SELECT supply_id, quantity FROM medication_details WHERE visit_id = ?", (visit_id,))] == [(1, 3)]
    assert db.execute("SELECT stock_level FROM batches WHERE batch_id = 1").fetchone()[0] == 7


def test_failed_medicine_leaves_no_visit_and_no_stock_change(client, headers, db):
    body = {**VISIT, "medications": [{"supply_id": 999, "quantity": 2}]}  # no such supply
    response = client.post("/addvisitlog", headers=headers("nurse"), json=body)
    assert response.status_code == 400
    assert db.execute("SELECT COUNT(*) FROM visit_logs").fetchone()[0] == 0
    assert db.execute("SELECT stock_level FROM batches WHERE batch_id = 1").fetchone()[0] == 10


def test_negative_medicine_quantity_is_refused(client, headers):
    body = {**VISIT, "medications": [{"supply_id": 1, "quantity": -4}]}
    assert client.post("/addvisitlog", headers=headers("nurse"), json=body).status_code == 400


def test_updating_a_visit_replaces_medicines_and_restocks(client, headers, db):
    h = headers("nurse")
    visit_id = client.post("/addvisitlog", headers=h, json={**VISIT, "medications": [{"supply_id": 1, "quantity": 3}]}).json["visit_id"]
    body = {"visit_id": visit_id, "weight": 50, "temperature": 37, "service_id": 1, "staff_id": 3, "notes": "better",
            "medications": [{"supply_id": 1, "quantity": 1}]}
    assert client.post("/updatevisitlog", headers=h, json=body).json == {"success": True}
    assert db.execute("SELECT notes FROM visit_logs WHERE visit_id = ?", (visit_id,)).fetchone()[0] == "better"
    assert db.execute("SELECT stock_level FROM batches WHERE batch_id = 1").fetchone()[0] == 9


def test_updating_a_missing_visit_reports_failure(client, headers):
    body = {"visit_id": 999, "notes": "x"}
    assert client.post("/updatevisitlog", headers=headers("nurse"), json=body).json == {"success": False}
