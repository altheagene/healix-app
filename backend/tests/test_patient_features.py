import sqlite3
from datetime import date, timedelta

from conftest import STUDENTS

TODAY = date.today()


def _add_patient(client, h, student_id, first, last, **extra):
    if "department" in extra:
        extra.setdefault("level", 1)
    body = {"first_name": first, "middle_name": "M", "last_name": last, "birthday": "2005-01-01",
            "sex": "female", "student_id": student_id, "is_student": True,
            "emergency_contact_name": "Parent", "emergency_contact_phone": "0917", **extra}
    response = client.post("/addpatient", headers=h, json=body)
    assert response.json["success"], response.json
    return response.json["patient_id"]


def _visit(client, h, patient_id, days_ago=0, **extra):
    when = (TODAY - timedelta(days=days_ago)).isoformat() + " 09:00:00"
    body = {"patient_id": patient_id, "service_id": 1, "staff_id": 3, "visit_datetime": when, **extra}
    response = client.post("/addvisitlog", headers=h, json=body)
    assert response.json["success"], response.json
    return response.json["visit_id"]


def _search(client, h, **params):
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return client.get(f"/searchpatients?{query}", headers=h).json


# ---------- list: filters, sorting, flags ----------

def test_rows_carry_allergies_last_visit_and_flags(client, headers):
    nurse = headers("nurse")
    pid = _add_patient(client, nurse, "S-0100", "Ben", "Reyes", allergies=[1])
    for days in (1, 5, 20):
        _visit(client, nurse, pid, days_ago=days)
    row = next(p for p in _search(client, nurse)["patients"] if p["patient_id"] == pid)
    assert row["allergies"] == "Penicillin"
    assert row["last_visit"].startswith((TODAY - timedelta(days=1)).isoformat())
    assert row["frequent_visitor"] is True and row["missing_info"] == 0


def test_filters_combine(client, headers):
    nurse = headers("nurse")
    a = _add_patient(client, nurse, "S-0101", "Cara", "Lim", department="College of Nursing", allergies=[1])
    _add_patient(client, nurse, "S-0102", "Dan", "Lim", department="College of Computer Studies", sex="male")
    _visit(client, nurse, a, days_ago=2)
    ids = lambda result: {p["student_id"] for p in result["patients"]}  # noqa: E731
    assert ids(_search(client, nurse, has_allergies=1)) == {"S-0101"}
    assert ids(_search(client, nurse, department="College of Computer Studies")) == {"S-0102"}
    assert ids(_search(client, nurse, sex="male")) == {"S-0102"}
    assert ids(_search(client, nurse, visited_within=7)) == {"S-0101"}
    assert ids(_search(client, nurse, q="lim", has_allergies=1)) == {"S-0101"}


def test_missing_info_and_frequent_flags(client, headers):
    nurse = headers("nurse")
    # The seeded patient S-0001 has no emergency contact.
    assert {p["student_id"] for p in _search(client, nurse, flag="missing_info")["patients"]} == {"S-0001"}
    pid = _add_patient(client, nurse, "S-0103", "Eve", "Tan")
    for days in (1, 2, 3):
        _visit(client, nurse, pid, days_ago=days)
    result = _search(client, nurse, flag="frequent")
    assert [p["student_id"] for p in result["patients"]] == ["S-0103"]
    assert result["stats"]["frequent"] == 1 and result["stats"]["missing_info"] == 1


def test_old_visits_do_not_make_a_frequent_visitor(client, headers):
    nurse = headers("nurse")
    pid = _add_patient(client, nurse, "S-0104", "Fay", "Uy")
    for days in (40, 50, 60):
        _visit(client, nurse, pid, days_ago=days)
    assert _search(client, nurse, flag="frequent")["patients"] == []


def test_sorting(client, headers):
    nurse = headers("nurse")
    _add_patient(client, nurse, "S-0105", "Gil", "Zamora")
    _add_patient(client, nurse, "S-0106", "Hana", "Abad")
    by_name = [p["last_name"] for p in _search(client, nurse, sort="name")["patients"]]
    assert by_name == sorted(by_name, key=str.lower)
    by_name_desc = [p["last_name"] for p in _search(client, nurse, sort="name", direction="desc")["patients"]]
    assert by_name_desc == list(reversed(by_name))


def test_never_visited_patients_sort_last_by_last_visit(client, headers):
    nurse = headers("nurse")
    pid = _add_patient(client, nurse, "S-0107", "Ian", "Cruz")
    _visit(client, nurse, pid, days_ago=1)
    for direction in ("asc", "desc"):
        rows = _search(client, nurse, sort="last_visit", direction=direction)["patients"]
        assert rows[0]["student_id"] == "S-0107" and rows[-1]["last_visit"] is None


def test_unknown_sort_is_ignored_not_injected(client, headers):
    result = _search(client, headers("nurse"), sort="patient_id;DROP TABLE patients")
    assert result["total"] == 1


def test_non_student_patients(client, headers):
    nurse = headers("nurse")
    _add_patient(client, nurse, None, "Jo", "Visitor", is_student=False)
    others = _search(client, nurse, patient_type="other")["patients"]
    assert [p["last_name"] for p in others] == ["Visitor"]
    students = _search(client, nurse, patient_type="student")["patients"]
    assert "Visitor" not in [p["last_name"] for p in students]


# ---------- archive ----------

def test_archive_hides_patient_from_list_and_pickers(client, headers):
    nurse = headers("nurse")
    pid = _add_patient(client, nurse, "S-0108", "Kai", "Graduated")
    assert client.post("/archivepatient", headers=nurse, json={"patient_id": pid}).json == {"success": True}
    assert pid not in [p["patient_id"] for p in _search(client, nurse)["patients"]]
    assert pid in [p["patient_id"] for p in _search(client, nurse, archived=1)["patients"]]
    assert pid not in [p["patient_id"] for p in client.get("/getallpatients", headers=nurse).json]
    assert client.post("/archivepatient", headers=nurse, json={"patient_id": pid, "archived": False}).json == {"success": True}
    assert pid in [p["patient_id"] for p in _search(client, nurse)["patients"]]


def test_staff_role_cannot_archive(client, headers):
    assert client.post("/archivepatient", headers=headers("staff"), json={"patient_id": 1}).status_code == 403


# ---------- check-in ----------

def test_check_in_finds_existing_patient(client, headers):
    result = client.get("/checkin?student_id=s-0001", headers=headers("staff")).json
    assert result["status"] == "patient" and result["patient"]["patient_id"] == 1


def test_check_in_falls_back_to_the_registry(client, headers):
    conn = sqlite3.connect(STUDENTS)
    conn.execute("INSERT INTO students VALUES ('S-9000', 'Lea')")
    conn.commit()
    conn.close()
    try:
        result = client.get("/checkin?student_id=S-9000", headers=headers("staff")).json
        assert result == {"status": "student", "student": {"student_id": "S-9000", "first_name": "Lea"}}
    finally:
        conn = sqlite3.connect(STUDENTS)
        conn.execute("DELETE FROM students WHERE student_id = 'S-9000'")
        conn.commit()
        conn.close()


def test_check_in_unknown_id(client, headers):
    assert client.get("/checkin?student_id=NOPE", headers=headers("staff")).json == {"status": "not_found"}


# ---------- timeline and vitals ----------

def test_timeline_merges_visits_appointments_and_changes(client, headers):
    nurse = headers("nurse")
    _visit(client, nurse, 1, days_ago=3, weight="50 kg", temperature="38.2", complaint="Fever",
           medications=[{"supply_id": 1, "quantity": 2}])
    _visit(client, nurse, 1, days_ago=1, weight="49.5", temperature="")
    client.post("/addpatientallergies", headers=nurse, json={"patient_id": 1, "allergies": [1]})
    timeline = client.get("/patienttimeline?idnum=1", headers=nurse).json
    types = [event["type"] for event in timeline["events"]]
    assert types.count("visit") == 2 and types.count("appointment") == 2 and "change" in types
    fever = next(e for e in timeline["events"] if e.get("complaint") == "Fever")
    assert fever["medicines"] == "2 x Paracetamol"
    assert [v["weight"] for v in timeline["vitals"]] == [50.0, 49.5]
    assert timeline["vitals"][0]["temperature"] == 38.2 and timeline["vitals"][1]["temperature"] is None


# ---------- printable summary ----------

def test_summary_is_for_clinicians_and_audited(client, headers, db):
    assert client.get("/patientsummary?idnum=1", headers=headers("staff")).status_code == 403
    summary = client.get("/patientsummary?idnum=1", headers=headers("doctor")).json
    assert summary["patient"]["student_id"] == "S-0001" and summary["generated_by"] == "doctor"
    row = db.execute("SELECT username FROM audit_logs WHERE action = 'patient_summary_export'").fetchone()
    assert row["username"] == "doctor"


def test_summary_for_missing_patient(client, headers):
    assert client.get("/patientsummary?idnum=999", headers=headers("doctor")).status_code == 404


# ---------- structured visit notes ----------

def test_structured_notes_are_saved_and_reported(client, headers):
    nurse = headers("nurse")
    visit_id = _visit(client, nurse, 1, complaint="Headache", assessment="Tension", treatment="Rest")
    logs = client.get("/getpatientcliniclogs?idnum=1", headers=nurse).json
    saved = next(log for log in logs if log["visit_id"] == visit_id)
    assert (saved["complaint"], saved["assessment"], saved["treatment"]) == ("Headache", "Tension", "Rest")
    period = f"fromdate={TODAY.isoformat()}&todate={TODAY.isoformat()}"
    assert [v["complaint"] for v in client.get(f"/clinic_visits?{period}", headers=nurse).json] == ["Headache"]


def test_editing_a_visit_keeps_weight_and_untouched_notes(client, headers, db):
    nurse = headers("nurse")
    visit_id = _visit(client, nurse, 1, weight="50", temperature="37", complaint="Cough")
    # The edit form sends capitalised Weight/Temperature and no complaint.
    body = {"visit_id": visit_id, "Weight": "51", "Temperature": "36.8", "notes": "better"}
    assert client.post("/updatevisitlog", headers=nurse, json=body).json == {"success": True}
    row = db.execute("SELECT Weight, Temperature, complaint, notes FROM visit_logs WHERE visit_id = ?", (visit_id,)).fetchone()
    assert tuple(row) == ("51", "36.8", "Cough", "better")
