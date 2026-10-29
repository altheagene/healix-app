import db.connection as connection
from models.inventory_model import edit_stock_batch

NEW_PATIENT = {
    "first_name": "Ben", "middle_name": "C", "last_name": "Reyes", "birthday": "2004-02-02",
    "sex": "male", "student_id": "S-0002", "is_student": True,
}


def test_sql_in_a_column_name_is_rejected(client, headers, db):
    body = {"patient_id": 1, "notes` = (SELECT password FROM staff LIMIT 1), `notes": "x"}
    response = client.post("/updatepatient", headers=headers("staff"), json=body)
    assert response.json == {"success": False}
    assert db.execute("SELECT notes FROM patients WHERE patient_id = 1").fetchone()[0] == "original note"


def test_unknown_column_is_rejected_on_insert(client, headers):
    body = {"patient_id": 1, "service_id": 1, "staff_id": 3, "visit_datetime": "2026-10-01 09:00:00", "bogus`) --": 1}
    response = client.post("/addvisitlog", headers=headers("doctor"), json=body)
    assert response.status_code == 400
    assert response.json["error"] == "Could not save the visit"


def test_normal_update_still_works(client, headers, db):
    response = client.post("/updatepatient", headers=headers("staff"), json={"patient_id": 1, "notes": "new note"})
    assert response.json == {"success": True}
    assert db.execute("SELECT notes FROM patients WHERE patient_id = 1").fetchone()[0] == "new note"


def test_update_matches_primary_key_not_first_json_key(client, headers, db):
    body = {"status": "Done", "appointment_id": 1}  # status first, as an attacker might send it
    assert client.post("/updateappointment", headers=headers("staff"), json=body).json == {"success": True}
    statuses = dict(db.execute("SELECT appointment_id, status FROM appointments").fetchall())
    assert statuses == {1: "Done", 2: "Scheduled"}


def test_add_patient_saves_allergies_and_conditions_with_returned_id(client, headers, db):
    body = {**NEW_PATIENT, "allergies": [1], "conditions": [1]}
    response = client.post("/addpatient", headers=headers("staff"), json=body)
    patient_id = response.json["patient_id"]
    assert response.json["success"] is True
    assert db.execute("SELECT student_id FROM patients WHERE patient_id = ?", (patient_id,)).fetchone()[0] == "S-0002"
    assert [tuple(r) for r in db.execute("SELECT allergy_id FROM patient_allergies WHERE patient_id = ?", (patient_id,)).fetchall()] == [(1,)]
    assert [tuple(r) for r in db.execute("SELECT condition_id FROM patient_conditions WHERE patient_id = ?", (patient_id,)).fetchall()] == [(1,)]


def test_add_patient_is_all_or_nothing(client, headers, db):
    body = {**NEW_PATIENT, "allergies": [999]}  # no such allergy
    response = client.post("/addpatient", headers=headers("staff"), json=body)
    assert response.json == {"success": False, "patient_id": None}
    assert db.execute("SELECT COUNT(*) FROM patients WHERE student_id = 'S-0002'").fetchone()[0] == 0


def test_duplicate_patient_is_reported(client, headers):
    body = {**NEW_PATIENT, "student_id": "S-0001"}
    assert client.post("/addpatient", headers=headers("staff"), json=body).json["success"] is False


def test_stock_adjustment_updates_and_logs_together(db):
    assert edit_stock_batch(1, 5, 2) is True
    assert db.execute("SELECT stock_level FROM batches WHERE batch_id = 1").fetchone()[0] == 13
    assert [tuple(r) for r in db.execute("SELECT item_in, item_out FROM inventory WHERE batch_id = 1").fetchall()] == [(5, 2)]


def test_stock_adjustment_for_unknown_batch_changes_nothing(db):
    assert edit_stock_batch(999, 5, 0) is False
    assert db.execute("SELECT COUNT(*) FROM inventory").fetchone()[0] == 0


def test_new_batch_logs_stock_against_itself(client, headers, db):
    body = {"supply_id": 1, "batch_number": "B-2", "expiration_date": "2099-01-01", "stock_level": 7, "is_active": 1}
    assert client.post("/addbatch", headers=headers("nurse"), json=body).json == {"success": True}
    batch_id = db.execute("SELECT batch_id FROM batches WHERE batch_number = 'B-2'").fetchone()[0]
    assert [tuple(r) for r in db.execute("SELECT item_in FROM inventory WHERE batch_id = ?", (batch_id,)).fetchall()] == [(7,)]


def test_unreachable_database_is_reported_not_hidden(monkeypatch, tmp_path):
    import sqlite3

    import pytest

    monkeypatch.setattr(connection, "database", str(tmp_path / "missing" / "x.db"))
    with pytest.raises(sqlite3.OperationalError):
        connection.getprocess("SELECT 1", [])
    with pytest.raises(sqlite3.OperationalError):
        connection.postprocess("UPDATE staff SET phone = ? WHERE staff_id = ?", ["1", 1])


def test_api_answers_503_when_database_is_down(client, headers, monkeypatch, tmp_path):
    h = headers("staff")
    monkeypatch.setattr(connection, "database", str(tmp_path / "missing" / "x.db"))
    response = client.get("/getallservices", headers=h)
    assert response.status_code == 503
    assert "database" in response.json["error"].lower()


def test_student_registry_failure_is_reported(client, headers, monkeypatch, tmp_path):
    import models.patient_model as patient_model

    monkeypatch.setattr(patient_model, "studentdb", str(tmp_path / "missing" / "s.db"))
    response = client.get("/getstudent?idnum=S-0001", headers=headers("staff"))
    assert response.status_code == 503


def test_middle_name_is_optional(client, headers, db):
    # The test database is built from schema.sql; an older clinic database still has
    # NOT NULL on the column, which is why the routes save "" and never NULL.
    staff = headers("staff")
    body = {key: value for key, value in NEW_PATIENT.items() if key != "middle_name"}
    response = client.post("/addpatient", headers=staff, json=body)
    assert response.json["success"], response.json
    patient_id = response.json["patient_id"]
    row = db.execute("SELECT middle_name FROM patients WHERE patient_id = ?", (patient_id,)).fetchone()
    assert row[0] == ""
    response = client.post("/updatepatient", headers=staff, json={"patient_id": 1, "middle_name": None})
    assert response.json == {"success": True}
    assert db.execute("SELECT middle_name FROM patients WHERE patient_id = 1").fetchone()[0] == ""
