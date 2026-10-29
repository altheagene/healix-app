from datetime import date, datetime, timedelta

TODAY = date.today()


def _visit(client, h, days_ago=0, hour=9, **extra):
    when = datetime.combine(TODAY - timedelta(days=days_ago), datetime.min.time()) + timedelta(hours=hour)
    body = {"patient_id": 1, "service_id": 1, "staff_id": 3, "visit_datetime": when.strftime("%Y-%m-%d %H:%M:%S"),
            **extra}
    response = client.post("/addvisitlog", headers=h, json=body)
    assert response.json["success"], response.json
    return response.json["visit_id"]


def _report(client, h, start, end):
    return client.get(f"/getclinicreport?date_from={start}&date_to={end}", headers=h)


def test_report_totals_outcomes_and_complaints(client, headers, db):
    nurse = headers("nurse")
    db.execute("INSERT INTO patients (patient_id, is_student, first_name, middle_name, last_name, birthday, sex,"
               " department, level) VALUES (2, 1, 'Ben', '', 'Reyes', '2012-01-01', 'male', 'Basic Education', 8)")
    db.commit()
    _visit(client, nurse, complaint="Fever", disposition="sent_home", picked_up_by="Mother",
           medications=[{"supply_id": 1, "quantity": 2}])
    _visit(client, nurse, days_ago=1, hour=13, complaint=" fever ", disposition="returned_to_class")
    _visit(client, nurse, days_ago=1, patient_id=2, complaint="Headache")
    _visit(client, nurse, days_ago=40, complaint="Old visit", disposition="returned_to_class")
    report = _report(client, nurse, TODAY - timedelta(days=6), TODAY).json

    totals = report["totals"]
    assert (totals["visits"], totals["students"], totals["repeat_students"], totals["days_open"]) == (3, 2, 1, 2)
    assert (totals["left_school"], totals["parents_told"], totals["units_given"]) == (1, 0, 2)
    assert {o["outcome"]: o["visits"] for o in report["outcomes"]} == {
        "sent_home": 1, "returned_to_class": 1, "in_clinic": 1}
    assert report["complaints"][0]["visits"] == 2  # "Fever" and " fever " are one complaint
    assert report["medicines"][0]["supply_name"] == "Paracetamol" and report["medicines"][0]["units"] == 2
    assert [f["patient_id"] for f in report["frequent"]] == [1]  # only students seen more than once
    assert {g["group"] for g in report["by_group"]} >= {"Junior High School"}
    assert len(report["by_day"]) == 7 and sum(d["visits"] for d in report["by_day"]) == 3
    assert {h["hour"]: h["visits"] for h in report["by_hour"]}[13] == 1


def test_report_compares_with_the_period_before(client, headers):
    nurse = headers("nurse")
    _visit(client, nurse, days_ago=8)
    _visit(client, nurse, days_ago=9)
    report = _report(client, nurse, TODAY - timedelta(days=6), TODAY).json
    assert (report["totals"]["visits"], report["totals"]["previous_visits"]) == (0, 2)


def test_report_is_for_clinicians_and_needs_valid_dates(client, headers):
    assert _report(client, headers("staff"), TODAY, TODAY).status_code == 403
    nurse = headers("nurse")
    assert client.get("/getclinicreport?date_from=yesterday&date_to=today", headers=nurse).status_code == 400
    assert _report(client, nurse, TODAY, TODAY - timedelta(days=1)).status_code == 400


def test_viewing_the_report_is_audited(client, headers, db):
    _report(client, headers("nurse"), TODAY, TODAY)
    actions = [row[0] for row in db.execute("SELECT action FROM audit_logs WHERE username = 'nurse'")]
    assert "clinic_report_view" in actions
