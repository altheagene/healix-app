"""Security audit log. Writes and reads audit_logs. Never stores passwords or tokens."""

import json
from datetime import datetime, timezone

from sqlite3 import connect

from db.connection import database, getprocess

SENSITIVE_KEYS = {
    "password",
    "current_password",
    "new_password",
    "confirm_password",
    "token",
    "authorization",
}

SKIP_PATHS = set()

ACTION_BY_PATH = {
    "/validateuser": "login",
    "/logout": "logout",
    "/resetpassword": "password_reset",
    "/addstaff": "staff_create",
    "/updatestaff": "staff_update",
    "/addpatient": "patient_create",
    "/updatepatient": "patient_update",
    "/addpatientallergies": "patient_allergy_add",
    "/addallergies": "patient_allergy_add",
    "/deletepatientallergies": "patient_allergy_delete",
    "/addpatientconditions": "patient_condition_add",
    "/addconditions": "patient_condition_add",
    "/deletepatientconditions": "patient_condition_delete",
    "/addnewallergy": "allergy_create",
    "/addnewcondition": "condition_create",
    "/addvisitlog": "visit_create",
    "/updatevisitlog": "visit_update",
    "/addmedicationdetails": "visit_medication_add",
    "/updatemedicationdetails": "visit_medication_update",
    "/additem": "inventory_create",
    "/updatesupply": "inventory_update",
    "/deleteitem": "inventory_update",
    "/addbatch": "inventory_batch_create",
    "/editbatch": "inventory_batch_update",
    "/updatebatchactive": "inventory_batch_update",
    "/editstockbatch": "inventory_stock_adjust",
    "/disposebatch": "inventory_dispose",
    "/addappointment": "appointment_create",
    "/updateappointment": "appointment_update",
    "/updateappointmentdetails": "appointment_update",
    "/addservice": "service_create",
    "/getauditlogs": "audit_view",
    "/adminresetpassword": "admin_password_reset",
    "/getpatient": "patient_view",
    "/getpatientallergies": "patient_view",
    "/getpatientconditions": "patient_view",
    "/getstudent": "student_view",
    "/findstudent": "student_view",
    "/getpatientcliniclogs": "visit_view",
    "/getmedicationdetails": "visit_view",
    "/checkin": "patient_checkin",
    "/patienttimeline": "patient_view",
    "/patientsummary": "patient_summary_export",
    "/archivepatient": "patient_archive",
    "/visitoutcome": "visit_outcome",
    "/notifyparent": "parent_notified",
    "/searchvisits": "visit_list_view",
    "/getvisit": "visit_view",
    "/download/visits": "visit_export",
}

# Reading someone's health record is logged too, not only changes to it.
VIEW_PATHS = {
    "/getpatient",
    "/getpatientallergies",
    "/getpatientconditions",
    "/getstudent",
    "/findstudent",
    "/getpatientcliniclogs",
    "/getmedicationdetails",
    "/checkin",
    "/patienttimeline",
    "/patientsummary",
    "/searchvisits",
    "/getvisit",
}


def ensure_audit_table():
    conn = connect(database)
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS audit_logs (
                audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                staff_id INTEGER,
                username TEXT,
                role_name TEXT,
                action TEXT NOT NULL,
                resource TEXT,
                method TEXT,
                path TEXT,
                status_code INTEGER,
                ip_address TEXT,
                user_agent TEXT,
                details TEXT,
                success INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
            CREATE INDEX IF NOT EXISTS idx_audit_logs_staff_id ON audit_logs(staff_id);
            CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
            """
        )
        conn.commit()
    finally:
        conn.close()


# Request values that say which record or report was touched. Everything else,
# such as names, diagnoses or notes, is logged by field name only.
REFERENCE_KEYS = {"id", "idnum", "fromdate", "todate", "limit", "action"}


def summarize_payload(payload):
    """Keep record ids and the names of the fields sent, never patient details."""
    if isinstance(payload, list):
        return {"items": len(payload)}
    if not isinstance(payload, dict):
        return None
    ids = {}
    for key, value in payload.items():
        name = str(key).lower()
        if _is_sensitive(key) or not isinstance(value, (int, str)):
            continue
        if name.endswith("_id") or name in REFERENCE_KEYS:
            ids[key] = value
    return {"fields": sorted(str(key) for key in payload), "ids": ids}


def _is_sensitive(key):
    name = str(key).lower()
    return name in SENSITIVE_KEYS or "password" in name or name == "token"


def action_for(path, method, status_code):
    if status_code == 401 and path == "/validateuser":
        return "login_failed"
    if status_code == 429 and path == "/validateuser":
        return "login_throttled"
    if status_code == 403:
        return "access_denied"
    if status_code == 401:
        return "auth_failed"
    return ACTION_BY_PATH.get(path) or _fallback_action(path, method)


def _fallback_action(path, method):
    name = (path or "").lower()
    if "delete" in name:
        return "delete"
    if any(part in name for part in ("add", "create")):
        return "create"
    if any(part in name for part in ("update", "edit")):
        return "update"
    if method == "GET":
        return "read"
    return method.lower() if method else "unknown"


def resource_for(path):
    name = (path or "").lower()
    if "audit" in name:
        return "audit"
    if any(part in name for part in ("password", "validateuser", "logout")):
        return "auth"
    if any(part in name for part in ("staff", "user")):
        return "staff"
    if any(part in name for part in ("patient", "allerg", "condition", "student")):
        return "patient"
    if any(part in name for part in ("visit", "clinic", "medication", "notifyparent")):
        return "visit"
    if any(part in name for part in ("batch", "item", "supply", "stock", "inv", "medicine")):
        return "inventory"
    if "appointment" in name:
        return "appointment"
    if "service" in name:
        return "service"
    return "app"


def should_audit(method, path, status_code):
    if method == "OPTIONS":
        return False
    if path in SKIP_PATHS:
        return False
    if method == "POST":
        return True
    if status_code >= 400:
        return True
    if path == "/getauditlogs" or path in VIEW_PATHS:
        return True
    if path.startswith("/download") or "report" in (path or ""):
        return True
    return False


def write_audit_log(
    staff_id=None,
    username=None,
    role_name=None,
    action="",
    resource=None,
    method=None,
    path=None,
    status_code=None,
    ip_address=None,
    user_agent=None,
    details=None,
    success=False,
):
    if not username and staff_id:
        rows = getprocess("SELECT username FROM staff WHERE staff_id = ?", [staff_id])
        if rows:
            username = rows[0].get("username")

    created_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    summary = summarize_payload(details)
    details_json = json.dumps(summary) if summary is not None else None

    sql = """
        INSERT INTO audit_logs (
            created_at, staff_id, username, role_name, action, resource,
            method, path, status_code, ip_address, user_agent, details, success
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    conn = connect(database)
    try:
        conn.execute(
            sql,
            (
                created_at,
                staff_id,
                username,
                role_name,
                action,
                resource,
                method,
                path,
                status_code,
                ip_address,
                (user_agent or "")[:250] or None,
                details_json,
                1 if success else 0,
            ),
        )
        conn.commit()
        return True
    except Exception as exc:
        print("AUDIT error:", exc)
        return False
    finally:
        conn.close()


def list_audit_logs(from_date=None, to_date=None, staff_id=None, action=None, limit=200):
    try:
        limit = min(max(int(limit), 1), 1000)
    except (TypeError, ValueError):
        limit = 200

    clauses = []
    values = []
    if from_date:
        clauses.append("DATE(created_at) >= DATE(?)")
        values.append(from_date)
    if to_date:
        clauses.append("DATE(created_at) <= DATE(?)")
        values.append(to_date)
    if staff_id:
        clauses.append("staff_id = ?")
        values.append(staff_id)
    if action:
        clauses.append("action = ?")
        values.append(action)

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = f"""
        SELECT
            audit_id, created_at, staff_id, username, role_name, action, resource,
            method, path, status_code, ip_address, user_agent, details, success
        FROM audit_logs
        {where}
        ORDER BY audit_id DESC
        LIMIT ?
    """
    values.append(limit)
    return getprocess(sql, values)
