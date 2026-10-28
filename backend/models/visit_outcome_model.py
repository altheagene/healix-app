"""How a clinic visit ended, and whether a parent was told. A visit is open, meaning the
student is still in the clinic, from check-in until an outcome is recorded."""

from datetime import datetime

from db.connection import getprocess, postprocess

DISPOSITIONS = {
    "returned_to_class": "Returned to class",
    "rested_returned": "Rested, then returned to class",
    "sent_home": "Sent home",
    "referred": "Referred",
    "emergency": "Emergency transfer",
}
# Outcomes where the student leaves with someone else, so a parent must know.
LEAVES_SCHOOL = {"sent_home", "referred", "emergency"}
NOTIFY_METHODS = {
    "call": "Phone call",
    "sms": "Text message",
    "in_person": "In person",
    "email": "Email",
    "other": "Other",
}


def now_local():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def open_visits():
    """Everyone in the clinic right now, longest-waiting first, with what staff need
    to look after them and to reach a parent."""
    rows = getprocess(
        """
        SELECT v.visit_id, v.patient_id, v.time_in, v.complaint, s.service_name,
               v.parent_notified, v.notified_at, v.notified_method,
               p.first_name, p.last_name, p.student_id, p.department, p.level,
               p.emergency_contact_name, p.emergency_contact_phone,
               (SELECT group_concat(a.allergy_name, ', ') FROM patient_allergies pa
                  JOIN allergies a ON a.allergy_id = pa.allergy_id WHERE pa.patient_id = p.patient_id) AS allergies
        FROM visit_logs v
        JOIN patients p ON p.patient_id = v.patient_id
        LEFT JOIN services s ON s.service_id = v.service_id
        WHERE v.time_in IS NOT NULL AND v.time_out IS NULL AND v.disposition IS NULL
        ORDER BY v.time_in
        """,
        [],
    )
    now = datetime.now()
    for row in rows:
        try:
            row["minutes_in_clinic"] = max(0, int((now - datetime.fromisoformat(row["time_in"])).total_seconds() // 60))
        except (TypeError, ValueError):
            row["minutes_in_clinic"] = None
        row["parent_notified"] = bool(row["parent_notified"])
    return rows


def visit_exists(visit_id):
    return bool(getprocess("SELECT 1 FROM visit_logs WHERE visit_id = ?", [visit_id]))


def record_outcome(visit_id, disposition, time_out=None, referred_to=None, picked_up_by=None, picked_up_at=None):
    time_out = time_out or now_local()
    return postprocess(
        """
        UPDATE visit_logs
        SET disposition = ?, time_out = ?, referred_to = ?, picked_up_by = ?, picked_up_at = ?
        WHERE visit_id = ?
        """,
        [
            disposition,
            time_out,
            referred_to if disposition in ("referred", "emergency") else None,
            picked_up_by if disposition in LEAVES_SCHOOL else None,
            (picked_up_at or time_out) if disposition in LEAVES_SCHOOL and picked_up_by else None,
            visit_id,
        ],
    )


def notify_parent(visit_id, method, notified_by):
    return postprocess(
        """
        UPDATE visit_logs
        SET parent_notified = 1, notified_at = ?, notified_method = ?, notified_by = ?
        WHERE visit_id = ?
        """,
        [now_local(), method, notified_by, visit_id],
    )
