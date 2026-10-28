def _add(client, h, student_id, first, last, sex="female", department="College of Nursing"):
    body = {"first_name": first, "middle_name": "M", "last_name": last, "birthday": "2005-01-01",
            "sex": sex, "student_id": student_id, "department": department, "level": 1, "is_student": True}
    assert client.post("/addpatient", headers=h, json=body).json["success"]


def test_search_pages_and_counts(client, headers):
    h = headers("staff")
    for i in range(12):
        _add(client, h, f"S-1{i:02d}", f"Maria{i}", "Santos", department="College of Nursing" if i % 2 else "College of Computer Studies")
    first = client.get("/searchpatients?q=santos&page=1&page_size=5", headers=h).json
    third = client.get("/searchpatients?q=santos&page=3&page_size=5", headers=h).json
    assert first["total"] == 12 and len(first["patients"]) == 5 and len(third["patients"]) == 2
    assert {k: first["stats"][k] for k in ("total", "departments", "male", "female")} == {
        "total": 13, "departments": 2, "male": 0, "female": 13}


def test_search_by_student_id_and_returns_only_list_columns(client, headers):
    h = headers("staff")
    result = client.get("/searchpatients?q=s-0001", headers=h).json
    assert [p["student_id"] for p in result["patients"]] == ["S-0001"]
    row = result["patients"][0]
    assert {"patient_id", "student_id", "first_name", "last_name", "last_visit", "allergies"} <= set(row)
    # The list never carries contact details or notes.
    assert not {"phone", "email", "notes", "emergency_contact_phone", "birthday"} & set(row)


def test_search_treats_wildcards_literally(client, headers):
    h = headers("staff")
    assert client.get("/searchpatients?q=%25", headers=h).json["total"] == 0
    assert client.get("/searchpatients?q=_", headers=h).json["total"] == 0


def test_page_size_is_capped_and_validated(client, headers):
    h = headers("staff")
    assert client.get("/searchpatients?page_size=5000", headers=h).json["page_size"] == 100
    assert client.get("/searchpatients?page=-1", headers=h).status_code == 400
