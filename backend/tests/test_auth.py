import os
import subprocess
import sys

import auth
from conftest import BACKEND


def test_server_refuses_to_start_without_secret():
    env = {k: v for k, v in os.environ.items() if k != "HEALIX_SECRET"}
    result = subprocess.run(
        [sys.executable, "-c", "import auth"],
        cwd=BACKEND, env=env, capture_output=True, text=True,
    )
    assert result.returncode != 0
    assert "HEALIX_SECRET" in result.stderr


def test_login_returns_token_without_secrets(client):
    response = client.post("/validateuser", json={"username": "nurse", "password": "correct-horse-1"})
    assert response.status_code == 200
    assert response.json["token"]
    assert "password" not in response.json["user"]
    assert "token_version" not in response.json["user"]


def test_wrong_password_is_refused(client):
    response = client.post("/validateuser", json={"username": "nurse", "password": "nope"})
    assert response.status_code == 401


def test_missing_token_is_refused(client):
    assert client.get("/getallservices").status_code == 401


def test_repeated_failed_logins_are_throttled(client):
    codes = [
        client.post("/validateuser", json={"username": "nurse", "password": "nope"}).status_code
        for _ in range(6)
    ]
    assert codes == [401] * 5 + [429]
    blocked = client.post("/validateuser", json={"username": "nurse", "password": "correct-horse-1"})
    assert blocked.status_code == 429
    assert int(blocked.headers["Retry-After"]) > 0


def test_throttle_ignores_spoofed_forwarded_for(client):
    for i in range(5):
        client.post(
            "/validateuser",
            json={"username": "nurse", "password": "nope"},
            headers={"X-Forwarded-For": f"10.0.0.{i}"},
        )
    response = client.post("/validateuser", json={"username": "nurse", "password": "nope"})
    assert response.status_code == 429


def test_logout_ends_the_session(client, headers):
    h = headers("nurse")
    assert client.post("/logout", headers=h).json == {"success": True}
    assert client.get("/getallservices", headers=h).status_code == 401


def test_role_change_applies_immediately(client, headers, db):
    h = headers("doctor")
    db.execute("UPDATE staff SET staff_category_id = 1 WHERE username = 'doctor'")
    db.commit()
    assert client.post("/addvisitlog", headers=h, json={}).status_code == 403


def test_token_with_role_inside_is_refused(client):
    forged = auth._serializer.dumps({"staff_id": 4, "staff_category_id": 4, "category_name": "Admin"})
    response = client.get("/getallservices", headers={"Authorization": "Bearer " + forged})
    assert response.status_code == 401


def test_updatestaff_cannot_change_password(client, headers, db):
    before = db.execute("SELECT password FROM staff WHERE username = 'nurse'").fetchone()[0]
    body = {
        "staff_id": 2, "first_name": "Test", "last_name": "Nurse", "staff_category_id": 2,
        "sex": "female", "phone": "1234", "email": "nurse@example.com", "username": "nurse",
        "password": "hijacked-1",
    }
    response = client.post("/updatestaff", headers=headers("nurse"), json=body)
    assert response.json == {"success": True}
    row = db.execute("SELECT password, phone FROM staff WHERE username = 'nurse'").fetchone()
    assert row["password"] == before
    assert row["phone"] == "1234"


def test_non_admin_cannot_change_own_role(client, headers):
    body = {
        "staff_id": 1, "first_name": "Test", "last_name": "Staff", "staff_category_id": 4,
        "sex": "female", "phone": "0", "email": "staff@example.com", "username": "staff",
    }
    assert client.post("/updatestaff", headers=headers("staff"), json=body).status_code == 403


def test_admin_can_reset_a_forgotten_password(client, headers, login):
    nurse = {"Authorization": "Bearer " + login("nurse")}
    response = client.post("/adminresetpassword", headers=headers("admin"), json={"staff_id": 2, "new_password": "fresh-start-9"})
    assert response.json == {"success": True}
    assert client.get("/getallservices", headers=nurse).status_code == 401  # signed out everywhere
    assert login("nurse", "fresh-start-9")


def test_only_admin_can_reset_someone_elses_password(client, headers):
    body = {"staff_id": 1, "new_password": "fresh-start-9"}
    assert client.post("/adminresetpassword", headers=headers("doctor"), json=body).status_code == 403


def test_weak_passwords_are_refused(client, headers):
    admin = headers("admin")
    for weak in ("short1", "password123", "nurse"):
        response = client.post("/adminresetpassword", headers=admin, json={"staff_id": 2, "new_password": weak})
        assert response.status_code == 400, weak


def test_new_staff_needs_a_strong_password(client, headers):
    body = {
        "first_name": "New", "last_name": "Person", "staff_category_id": 1, "sex": "female",
        "phone": "0", "email": "new@example.com", "username": "newperson", "password": "12345678",
    }
    assert client.post("/addstaff", headers=headers("admin"), json=body).status_code == 400


def test_me_reports_the_current_role(client, headers, db):
    h = headers("doctor")
    assert client.get("/me", headers=h).json == {"staff_id": 3, "username": "doctor", "staff_category_id": 3, "category_name": "Doctor"}
    db.execute("UPDATE staff SET staff_category_id = 4 WHERE username = 'doctor'")
    db.commit()
    assert client.get("/me", headers=h).json["category_name"] == "Admin"
