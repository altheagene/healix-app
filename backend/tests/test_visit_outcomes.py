from datetime import datetime, timedelta

VISIT = {"patient_id": 1, "service_id": 1, "staff_id": 3, "complaint": "Fever"}


def _open_visit(client, h, minutes_ago=0, **extra):
    when = (datetime.now() - timedelta(minutes=minutes_ago)).strftime("%Y-%m-%d %H:%M:%S")
    response = client.post("/addvisitlog", headers=h, json={**VISIT, "visit_datetime": when, **extra})
    assert response.json["success"], response.json
    return response.json["visit_id"]


def test_a_new_visit_is_open_and_on_the_board(client, headers):
    nurse = headers("nurse")
    visit_id = _open_visit(client, nurse, minutes_ago=25)
    board = client.get("/clinicnow", headers=headers("staff")).json
    assert [row["visit_id"] for row in board] == [visit_id]
    row = board[0]
    assert row["first_name"] == "Ana" and row["complaint"] == "Fever"
    assert 24 <= row["minutes_in_clinic"] <= 26
    assert row["parent_notified"] is False


def test_visits_saved_before_outcomes_existed_never_show_as_open(client, headers, db):
    db.execute("INSERT INTO visit_logs (patient_id, service_id, staff_id, visit_datetime) VALUES (1, 1, 3, '2025-01-01 08:00:00')")
    db.commit()
    assert client.get("/clinicnow", headers=headers("nurse")).json == []


def test_board_lists_longest_waiting_first(client, headers):
    nurse = headers("nurse")
    recent = _open_visit(client, nurse, minutes_ago=5)
    older = _open_visit(client, nurse, minutes_ago=50)
    assert [row["visit_id"] for row in client.get("/clinicnow", headers=nurse).json] == [older, recent]


def test_closing_a_visit_takes_it_off_the_board(client, headers, db):
    nurse = headers("nurse")
    visit_id = _open_visit(client, nurse)
    response = client.post("/visitoutcome", headers=nurse, json={"visit_id": visit_id, "disposition": "returned_to_class"})
    assert response.json == {"success": True}
    assert client.get("/clinicnow", headers=nurse).json == []
    row = db.execute("SELECT disposition, time_out FROM visit_logs WHERE visit_id = ?", (visit_id,)).fetchone()
    assert row["disposition"] == "returned_to_class" and row["time_out"]


def test_sent_home_needs_who_picked_them_up(client, headers, db):
    nurse = headers("nurse")
    visit_id = _open_visit(client, nurse)
    missing = client.post("/visitoutcome", headers=nurse, json={"visit_id": visit_id, "disposition": "sent_home"})
    assert missing.status_code == 400 and "picked" in missing.json["error"]
    ok = client.post("/visitoutcome", headers=nurse,
                     json={"visit_id": visit_id, "disposition": "sent_home", "picked_up_by": "Mother, Maria Cruz"})
    assert ok.json == {"success": True}
    row = db.execute("SELECT picked_up_by, picked_up_at, time_out FROM visit_logs WHERE visit_id = ?", (visit_id,)).fetchone()
    assert row["picked_up_by"] == "Mother, Maria Cruz" and row["picked_up_at"] == row["time_out"]


def test_referral_needs_a_destination(client, headers):
    nurse = headers("nurse")
    visit_id = _open_visit(client, nurse)
    assert client.post("/visitoutcome", headers=nurse,
                       json={"visit_id": visit_id, "disposition": "referred"}).status_code == 400
    assert client.post("/visitoutcome", headers=nurse,
                       json={"visit_id": visit_id, "disposition": "referred", "referred_to": "City Hospital"}).json == {"success": True}


def test_unknown_disposition_and_missing_visit(client, headers):
    nurse = headers("nurse")
    visit_id = _open_visit(client, nurse)
    assert client.post("/visitoutcome", headers=nurse, json={"visit_id": visit_id, "disposition": "teleported"}).status_code == 400
    assert client.post("/visitoutcome", headers=nurse, json={"visit_id": 999, "disposition": "returned_to_class"}).status_code == 404


def test_staff_role_can_notify_a_parent_but_not_close_a_visit(client, headers, db):
    visit_id = _open_visit(client, headers("nurse"))
    staff = headers("staff")
    assert client.post("/visitoutcome", headers=staff, json={"visit_id": visit_id, "disposition": "returned_to_class"}).status_code == 403
    assert client.post("/notifyparent", headers=staff, json={"visit_id": visit_id, "method": "call"}).json == {"success": True}
    row = db.execute("SELECT parent_notified, notified_method, notified_by, notified_at FROM visit_logs WHERE visit_id = ?",
                     (visit_id,)).fetchone()
    assert (row["parent_notified"], row["notified_method"], row["notified_by"]) == (1, "call", "staff")
    assert row["notified_at"]
    assert client.get("/clinicnow", headers=staff).json[0]["parent_notified"] is True


def test_notify_method_must_be_known(client, headers):
    visit_id = _open_visit(client, headers("nurse"))
    assert client.post("/notifyparent", headers=headers("nurse"), json={"visit_id": visit_id, "method": "pigeon"}).status_code == 400


def test_a_visit_can_be_closed_when_it_is_saved(client, headers):
    nurse = headers("nurse")
    when = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    response = client.post("/addvisitlog", headers=nurse,
                           json={**VISIT, "visit_datetime": when, "disposition": "returned_to_class"})
    assert response.json["success"]
    assert client.get("/clinicnow", headers=nurse).json == []


def test_outcome_shows_in_visit_list_timeline_and_audit(client, headers, db):
    nurse = headers("nurse")
    visit_id = _open_visit(client, nurse)
    client.post("/notifyparent", headers=nurse, json={"visit_id": visit_id, "method": "sms"})
    client.post("/visitoutcome", headers=nurse, json={"visit_id": visit_id, "disposition": "sent_home", "picked_up_by": "Father"})
    log = next(v for v in client.get("/getpatientcliniclogs?idnum=1", headers=nurse).json if v["visit_id"] == visit_id)
    assert (log["disposition"], log["picked_up_by"], log["notified_method"]) == ("sent_home", "Father", "sms")
    event = next(e for e in client.get("/patienttimeline?idnum=1", headers=nurse).json["events"] if e.get("visit_id") == visit_id)
    assert event["disposition"] == "sent_home"
    actions = {row[0] for row in db.execute("SELECT action FROM audit_logs WHERE resource = 'visit'")}
    assert {"visit_outcome", "parent_notified"} <= actions
