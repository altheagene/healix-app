"""Checks the audit hook in app.py together with models/audit_model.py."""

import json


def test_audit_keeps_ids_and_field_names_but_not_values(client, headers, db):
    client.post("/updatepatient", headers=headers("staff"), json={"patient_id": 1, "notes": "SECRET-DIAGNOSIS"})
    details = db.execute(
        "SELECT details FROM audit_logs WHERE path = '/updatepatient' ORDER BY audit_id DESC"
    ).fetchone()[0]
    assert "SECRET-DIAGNOSIS" not in details
    assert json.loads(details) == {"fields": ["notes", "patient_id"], "ids": {"patient_id": 1}}


def test_audit_ignores_spoofed_forwarded_for(client, db):
    client.post("/validateuser", json={"username": "nurse", "password": "nope"}, headers={"X-Forwarded-For": "1.2.3.4"})
    row = db.execute("SELECT action, ip_address FROM audit_logs WHERE path = '/validateuser'").fetchone()
    assert row["action"] == "login_failed"
    assert row["ip_address"] == "127.0.0.1"


def test_audit_never_stores_passwords(client, db):
    client.post("/validateuser", json={"username": "nurse", "password": "correct-horse-1"})
    assert "correct-horse-1" not in (db.execute("SELECT details FROM audit_logs").fetchone()[0] or "")


def test_logout_is_audited(client, headers, db):
    client.post("/logout", headers=headers("nurse"))
    row = db.execute("SELECT action, resource FROM audit_logs WHERE path = '/logout'").fetchone()
    assert (row["action"], row["resource"]) == ("logout", "auth")


def test_viewing_a_patient_record_is_audited(client, headers, db):
    client.get("/getpatient?idnum=1", headers=headers("staff"))
    client.get("/getpatientallergies?idnum=1", headers=headers("staff"))
    rows = db.execute("SELECT action, username, details FROM audit_logs WHERE action = 'patient_view'").fetchall()
    assert len(rows) == 2
    assert rows[0]["username"] == "staff"
    assert json.loads(rows[0]["details"])["ids"] == {"idnum": "1"}


def test_listing_services_is_not_audited(client, headers, db):
    client.get("/getallservices", headers=headers("staff"))
    assert db.execute("SELECT COUNT(*) FROM audit_logs WHERE path = '/getallservices'").fetchone()[0] == 0


def test_my_activity_shows_my_changes_and_failed_sign_ins_only(client, headers, login):
    client.post("/validateuser", json={"username": "nurse", "password": "nope"})
    nurse = headers("nurse")
    client.post("/updatepatient", headers=nurse, json={"patient_id": 1, "notes": "x"})
    client.get("/getpatient?idnum=1", headers=nurse)
    client.post("/updatepatient", headers=headers("staff"), json={"patient_id": 1, "notes": "y"})

    rows = client.get("/myactivity", headers=nurse).json
    actions = [row["action"] for row in rows]
    assert actions[0] == "patient_update"
    assert "login" in actions and "login_failed" in actions
    assert "patient_view" not in actions
    assert actions.count("patient_update") == 1
    assert set(rows[0]) == {"audit_id", "created_at", "action", "resource", "success"}


def test_my_activity_caps_the_limit(client, headers):
    nurse = headers("nurse")
    for _ in range(3):
        client.post("/logout", headers=nurse)
        nurse = headers("nurse")
    assert len(client.get("/myactivity?limit=2", headers=nurse).json) == 2
