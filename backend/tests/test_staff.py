from conftest import PASSWORD

NURSE = {"staff_id": 2, "first_name": "Test", "middle_name": "", "last_name": "nurse", "staff_category_id": 2,
         "sex": "female", "phone": "0", "email": "nurse@example.com", "username": "nurse"}


def test_switched_off_staff_cannot_sign_in_or_keep_their_session(client, headers):
    admin = headers("admin")
    nurse = headers("nurse")
    assert client.post("/setstaffactive", headers=admin, json={"staff_id": 2, "is_active": False}).json == {"success": True}
    assert client.get("/me", headers=nurse).status_code == 401  # signed out at once
    response = client.post("/validateuser", json={"username": "nurse", "password": PASSWORD})
    assert response.status_code == 403 and "switched off" in response.json["error"]
    assert client.post("/setstaffactive", headers=admin, json={"staff_id": 2, "is_active": True}).json == {"success": True}
    assert client.post("/validateuser", json={"username": "nurse", "password": PASSWORD}).status_code == 200


def test_a_wrong_password_on_a_switched_off_account_says_nothing_about_it(client, headers):
    client.post("/setstaffactive", headers=headers("admin"), json={"staff_id": 2, "is_active": False})
    response = client.post("/validateuser", json={"username": "nurse", "password": "wrong-password"})
    assert response.status_code == 401


def test_only_admins_switch_accounts_off(client, headers):
    response = client.post("/setstaffactive", headers=headers("doctor"), json={"staff_id": 2, "is_active": False})
    assert response.status_code == 403


def test_the_last_admin_is_protected(client, headers):
    admin = headers("admin")
    off = client.post("/setstaffactive", headers=admin, json={"staff_id": 4, "is_active": False})
    assert off.status_code == 400  # cannot switch yourself off
    demote = {"staff_id": 4, "first_name": "Test", "last_name": "admin", "staff_category_id": 2, "sex": "female",
              "phone": "0", "email": "admin@example.com", "username": "admin"}
    response = client.post("/updatestaff", headers=admin, json=demote)
    assert response.status_code == 400 and "only admin" in response.json["error"]
    # With a second admin, the first may step down.
    client.post("/updatestaff", headers=admin, json={**NURSE, "staff_category_id": 4})
    assert client.post("/updatestaff", headers=admin, json=demote).json == {"success": True}


def test_usernames_must_be_unique(client, headers):
    admin = headers("admin")
    taken = client.post("/updatestaff", headers=admin, json={**NURSE, "username": "Doctor"})
    assert taken.status_code == 400 and "taken" in taken.json["error"]
    body = {"first_name": "New", "last_name": "Person", "staff_category_id": 1, "username": "nurse",
            "password": "a-long-password-9"}
    assert client.post("/addstaff", headers=admin, json=body).status_code == 400


def test_edit_saves_middle_name_and_birthday(client, headers, db):
    body = {**NURSE, "middle_name": " Reyes ", "birthday": "1991-04-05"}
    assert client.post("/updatestaff", headers=headers("nurse"), json=body).json == {"success": True}
    row = db.execute("SELECT middle_name, birthday FROM staff WHERE staff_id = 2").fetchone()
    assert tuple(row) == ("Reyes", "1991-04-05")


def test_admin_sees_last_sign_in_and_active_flag(client, headers):
    headers("nurse")
    rows = {r["staff_id"]: r for r in client.get("/getstaffandcateg", headers=headers("admin")).json}
    assert rows[2]["last_login"] and rows[2]["is_active"] == 1
    assert "contact_hidden" not in rows[2]
