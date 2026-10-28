import csv
import io
from datetime import date, datetime, timedelta

TODAY = date.today()


def _visit(client, h, patient_id=1, days_ago=0, **extra):
    when = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d %H:%M:%S")
    body = {"patient_id": patient_id, "service_id": 1, "staff_id": 3, "visit_datetime": when, **extra}
    response = client.post("/addvisitlog", headers=h, json=body)
    assert response.json["success"], response.json
    return response.json["visit_id"]


def _search(client, h, **params):
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return client.get(f"/searchvisits?{query}", headers=h).json


def test_list_has_no_notes_or_vitals(client, headers):
    nurse = headers("nurse")
    _visit(client, nurse, complaint="Fever", notes="private note", weight="50")
    row = _search(client, nurse)["visits"][0]
    assert row["complaint"] == "Fever" and row["patient_name"] == "Ana B Cruz"
    assert not {"notes", "Weight", "weight", "Temperature", "assessment", "treatment"} & set(row)


def test_empty_middle_name_gives_no_double_space(client, headers, db):
    db.execute("UPDATE patients SET middle_name = '' WHERE patient_id = 1")
    db.commit()
    nurse = headers("nurse")
    _visit(client, nurse)
    assert _search(client, nurse)["visits"][0]["patient_name"] == "Ana Cruz"
    assert client.get("/getvisitlogs", headers=nurse).json[0]["patient_name"] == "Ana Cruz"


def test_filters_by_date_outcome_and_search(client, headers):
    nurse = headers("nurse")
    old = _visit(client, nurse, days_ago=10, complaint="Cough", disposition="returned_to_class")
    sent = _visit(client, nurse, complaint="Fever", disposition="sent_home", picked_up_by="Mother")
    open_visit = _visit(client, nurse, complaint="Headache")
    ids = lambda **p: [v["visit_id"] for v in _search(client, nurse, **p)["visits"]]  # noqa: E731
    assert set(ids(date_from=TODAY.isoformat(), date_to=TODAY.isoformat())) == {sent, open_visit}
    assert ids(outcome="sent_home") == [sent]
    assert ids(outcome="in_clinic") == [open_visit]
    assert ids(q="cough") == [old]
    assert ids(q=f"%23{sent}") == [sent]  # "#12" finds visit 12


def test_sorting_and_paging(client, headers):
    nurse = headers("nurse")
    ids = [_visit(client, nurse, days_ago=d) for d in (3, 1, 2)]
    newest_first = [v["visit_id"] for v in _search(client, nurse)["visits"]]
    assert newest_first == [ids[1], ids[2], ids[0]]
    oldest_first = [v["visit_id"] for v in _search(client, nurse, direction="asc")["visits"]]
    assert oldest_first == list(reversed(newest_first))
    page = _search(client, nurse, page=2, page_size=2)
    assert page["total"] == 3 and [v["visit_id"] for v in page["visits"]] == [ids[0]]


def test_stats(client, headers):
    nurse = headers("nurse")
    _visit(client, nurse, days_ago=40, disposition="returned_to_class")
    _visit(client, nurse, complaint="Fever", disposition="referred", referred_to="Hospital")
    _visit(client, nurse)
    stats = _search(client, nurse)["stats"]
    assert stats["today"] == 2 and stats["in_clinic"] == 1 and stats["left_school_today"] == 1


def test_bad_dates_are_refused(client, headers):
    response = client.get("/searchvisits?date_from=28/10/2026", headers=headers("nurse"))
    assert response.status_code == 400


def test_get_visit_has_full_details_and_contact(client, headers):
    nurse = headers("nurse")
    visit_id = _visit(client, nurse, notes="Rested", complaint="Dizzy", weight="51")
    visit = client.get(f"/getvisit?idnum={visit_id}", headers=nurse).json
    assert (visit["notes"], visit["complaint"], visit["Weight"]) == ("Rested", "Dizzy", "51")
    assert "emergency_contact_phone" in visit and visit["staff_name"] == "Test doctor"
    assert client.get("/getvisit?idnum=999", headers=nurse).status_code == 404


def test_list_views_and_details_are_audited(client, headers, db):
    nurse = headers("nurse")
    visit_id = _visit(client, nurse)
    client.get("/searchvisits?q=ana", headers=nurse)
    client.get(f"/getvisit?idnum={visit_id}", headers=nurse)
    actions = [row[0] for row in db.execute("SELECT action FROM audit_logs WHERE username = 'nurse'")]
    assert "visit_list_view" in actions and "visit_view" in actions


def test_export_is_clinicians_only_filtered_and_safe(client, headers):
    nurse = headers("nurse")
    _visit(client, nurse, complaint="=HYPERLINK(\"http://evil\")", disposition="returned_to_class")
    _visit(client, nurse, days_ago=10, complaint="Old, with a comma")
    assert client.get("/download/visits", headers=headers("staff")).status_code == 403
    response = client.get(f"/download/visits?date_from={TODAY.isoformat()}", headers=nurse)
    rows = list(csv.reader(io.StringIO(response.get_data(as_text=True))))
    assert rows[0][:3] == ["Visit ID", "Date and time", "Patient"]
    assert len(rows) == 2  # header + today's visit only
    assert rows[1][8].startswith("'=")  # spreadsheet would otherwise run it as a formula
    assert rows[1][9] == "Returned to class"
