import re

import school
from conftest import BACKEND

STUDENT = {"first_name": "Ria", "middle_name": "M", "last_name": "Diaz", "birthday": "2010-01-01", "sex": "female",
           "is_student": True}


def _add(client, h, student_id, **fields):
    return client.post("/addpatient", headers=h, json={**STUDENT, "student_id": student_id, **fields})


def test_frontend_lists_match_the_backend():
    ts = (BACKEND.parent / "app" / "school.ts").read_text(encoding="utf-8")
    colleges = re.search(r"export const COLLEGES = \[(.*?)\]", ts, re.S).group(1)
    strands = re.search(r"export const STRANDS = \[(.*?)\]", ts, re.S).group(1)
    assert tuple(re.findall(r'"([^"]+)"', colleges)) == school.COLLEGES
    assert tuple(re.findall(r'"([^"]+)"', strands)) == school.STRANDS
    assert f'export const BASIC_EDUCATION = "{school.BASIC_EDUCATION}"' in ts


def test_basic_education_kinder_to_grade_12(client, headers):
    h = headers("nurse")
    assert _add(client, h, "B-0", department="Basic Education", level=0).json["success"]
    assert _add(client, h, "B-12", department="Basic Education", level=12).json["success"]
    response = _add(client, h, "B-13", department="Basic Education", level=13)
    assert response.status_code == 400 and "Kindergarten" in response.json["error"]


def test_college_year_levels(client, headers):
    h = headers("nurse")
    assert _add(client, h, "C-1", department="College of Nursing", level=4).json["success"]
    assert _add(client, h, "C-2", department="College of Nursing", level=6).status_code == 400


def test_unknown_department_and_missing_level(client, headers):
    h = headers("nurse")
    assert "Unknown department" in _add(client, h, "X-1", department="Nursing", level=1).json["error"]
    assert _add(client, h, "X-2", department="College of Nursing").json["error"] == "Choose a level"


def test_strand_only_for_senior_high(client, headers, db):
    h = headers("nurse")
    assert _add(client, h, "S-11", department="Basic Education", level=11, strand="STEM").json["success"]
    assert db.execute("SELECT strand FROM patients WHERE student_id = 'S-11'").fetchone()[0] == "STEM"
    assert _add(client, h, "S-8", department="Basic Education", level=8, strand="STEM").status_code == 400
    assert _add(client, h, "S-C", department="College of Business", level=2, strand="ABM").status_code == 400
    assert _add(client, h, "S-Z", department="Basic Education", level=12, strand="ZZZ").status_code == 400


def test_staff_and_visitors_need_no_department(client, headers):
    body = {**STUDENT, "is_student": False}
    assert client.post("/addpatient", headers=headers("nurse"), json=body).json["success"]


def test_moving_down_from_senior_high_must_drop_the_strand(client, headers, db):
    h = headers("nurse")
    pid = _add(client, h, "S-12", department="Basic Education", level=12, strand="HUMSS").json["patient_id"]
    kept_strand = client.post("/updatepatient", headers=h, json={"patient_id": pid, "level": 9})
    assert kept_strand.status_code == 400 and "strand" in kept_strand.json["error"]
    cleared = client.post("/updatepatient", headers=h, json={"patient_id": pid, "level": 9, "strand": ""})
    assert cleared.json == {"success": True}
    row = db.execute("SELECT level, strand FROM patients WHERE patient_id = ?", (pid,)).fetchone()
    assert (row["level"], row["strand"]) == (9, None)


def test_updating_other_fields_skips_department_checks(client, headers):
    # The seeded patient has no department; editing notes must still work.
    assert client.post("/updatepatient", headers=headers("nurse"), json={"patient_id": 1, "notes": "ok"}).json == {"success": True}


def test_old_department_names_are_moved_on_startup(db):
    from migrations import run_migrations

    db.executemany(
        "INSERT INTO patients (is_student, student_id, first_name, middle_name, last_name, birthday, sex, department) "
        "VALUES (1, ?, 'Old', 'M', 'Record', '2004-01-01', 'male', ?)",
        [("L-1", "BSIT"), ("L-2", "College of Information Technology"), ("L-3", "College of Industrial Engineering")],
    )
    db.commit()
    run_migrations()
    rows = dict(db.execute("SELECT student_id, department FROM patients WHERE student_id LIKE 'L-%'").fetchall())
    assert rows == {"L-1": "College of Computer Studies", "L-2": "College of Computer Studies",
                    "L-3": "College of Engineering"}


def test_stage_filter(client, headers):
    h = headers("nurse")
    _add(client, h, "E-3", department="Basic Education", level=3)
    _add(client, h, "J-8", department="Basic Education", level=8)
    _add(client, h, "H-11", department="Basic Education", level=11, strand="GAS")
    _add(client, h, "C-3", department="College of Nursing", level=3)
    ids = lambda stage: {p["student_id"] for p in client.get(f"/searchpatients?stage={stage}", headers=h).json["patients"]}  # noqa: E731
    assert ids("elementary") == {"E-3"}
    assert ids("junior_high") == {"J-8"}
    assert ids("senior_high") == {"H-11"}
    assert next(p for p in client.get("/searchpatients?stage=senior_high", headers=h).json["patients"])["strand"] == "GAS"
