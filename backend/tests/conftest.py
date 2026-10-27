"""Test setup. Every test gets a fresh database built from db/schema.sql with made-up
data, so no test ever reads or writes the real clinic database."""

import atexit
import os
import shutil
import sqlite3
import sys
import tempfile
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parent.parent
_tmp = Path(tempfile.mkdtemp(prefix="healix-tests-"))
atexit.register(shutil.rmtree, _tmp, ignore_errors=True)
DB = _tmp / "clinic.db"
TEMPLATE = _tmp / "template.db"
STUDENTS = _tmp / "students.db"

# Must be set before any backend module is imported, because they read it at import.
os.environ.update(
    HEALIX_SECRET="test-only-secret",
    HEALIX_DB=str(DB),
    HEALIX_STUDENT_DB=str(STUDENTS),
)
sys.path.insert(0, str(BACKEND))

PASSWORD = "correct-horse-1"
ROLE_USERS = {1: "staff", 2: "nurse", 3: "doctor", 4: "admin"}


def _build_database(path):
    from werkzeug.security import generate_password_hash

    conn = sqlite3.connect(path)
    conn.executescript((BACKEND / "db" / "schema.sql").read_text(encoding="utf-8"))
    conn.executemany(
        "INSERT INTO staff_categories (staff_category_id, category_name) VALUES (?, ?)",
        [(1, "Staff"), (2, "Nurse"), (3, "Doctor"), (4, "Admin")],
    )
    hashed = generate_password_hash(PASSWORD)
    conn.executemany(
        """INSERT INTO staff (staff_id, first_name, last_name, staff_category_id, sex,
                              phone, email, username, password)
           VALUES (?, 'Test', ?, ?, 'female', '0', ?, ?, ?)""",
        [(role, name, role, f"{name}@example.com", name, hashed) for role, name in ROLE_USERS.items()],
    )
    conn.execute("INSERT INTO allergies (allergy_id, allergy_name) VALUES (1, 'Penicillin')")
    conn.execute("INSERT INTO conditions (condition_id, condition_name) VALUES (1, 'Asthma')")
    conn.execute("INSERT INTO services (service_id, service_name) VALUES (1, 'Checkup')")
    conn.execute("INSERT INTO supplies_categories (category_id, category_name) VALUES (1, 'Medicine')")
    conn.execute(
        """INSERT INTO supplies (supply_id, supply_name, category_id, auto_deduct, is_active)
           VALUES (1, 'Paracetamol', 1, 1, 1)"""
    )
    conn.execute(
        """INSERT INTO batches (batch_id, supply_id, batch_number, expiration_date, stock_level, is_active)
           VALUES (1, 1, 'B-1', '2099-01-01', 10, 1)"""
    )
    conn.execute(
        """INSERT INTO patients (patient_id, is_student, student_id, first_name, middle_name,
                                 last_name, birthday, sex, notes)
           VALUES (1, 1, 'S-0001', 'Ana', 'B', 'Cruz', '2005-01-01', 'female', 'original note')"""
    )
    conn.executemany(
        """INSERT INTO appointments (appointment_id, appointment_date, patient_id, service_id, status)
           VALUES (?, '2026-01-01', 1, 1, 'Scheduled')""",
        [(1,), (2,)],
    )
    conn.commit()
    conn.close()

    students = sqlite3.connect(STUDENTS)
    students.execute("CREATE TABLE students (student_id TEXT PRIMARY KEY, first_name TEXT)")
    students.execute("INSERT INTO students VALUES ('S-0001', 'Ana')")
    students.commit()
    students.close()


_build_database(DB)
import app as app_module  # noqa: E402  runs the startup migrations against DB
shutil.copyfile(DB, TEMPLATE)


@pytest.fixture(autouse=True)
def fresh_database():
    shutil.copyfile(TEMPLATE, DB)
    import login_throttle

    login_throttle._failures.clear()
    yield


@pytest.fixture
def app():
    return app_module.app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    yield conn
    conn.close()


@pytest.fixture
def login(client):
    def _login(username, password=PASSWORD):
        response = client.post("/validateuser", json={"username": username, "password": password})
        assert response.status_code == 200, response.json
        return response.json["token"]
    return _login


@pytest.fixture
def headers(login):
    """headers("nurse") -> Authorization headers for a fresh login as that role."""
    def _headers(username):
        return {"Authorization": "Bearer " + login(username)}
    return _headers
