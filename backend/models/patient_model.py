"""Patient, allergy, and condition queries. No Flask code lives here."""

from datetime import date, timedelta
from sqlite3 import Row, connect

from db.connection import REJECTED_WRITE, database, getprocess, studentdb
from db.dbhelper import addrecord, checked_columns, deletemedical, updaterecord


def find_student_record(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())

    sql = f"SELECT * FROM {table} WHERE `{keys[0]}` = ?"
    return getprocess(sql, values)


def get_student(**kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())
    sql = f"SELECT * FROM students WHERE `{keys[0]}` = ?"

    conn = connect(studentdb)
    try:
        conn.row_factory = Row
        return [dict(row) for row in conn.execute(sql, values).fetchall()]
    finally:
        conn.close()


def get_allergies(table="allergies"):
    sql = f"SELECT * FROM {table}"
    return getprocess(sql, [])


def get_conditions(table="conditions"):
    sql = f"SELECT * from {table}"
    return getprocess(sql, [])


def get_all_patients():
    """Patients for pickers. Archived (graduated) patients are left out."""
    return getprocess("SELECT * FROM patients WHERE coalesce(archived, 0) = 0", [])


# Visits within this many days that make someone a frequent visitor worth a check-in.
FREQUENT_VISITS = 3
FREQUENT_WINDOW_DAYS = 30

# Sort keys the client may ask for, mapped to fixed SQL. Never interpolate client text.
SORTS = {
    "patient_id": ["patient_id"],
    "name": ["lower(last_name)", "lower(first_name)"],
    "student_id": ["lower(coalesce(student_id, ''))"],
    "department": ["lower(coalesce(department, ''))"],
    "level": ["level"],
    "sex": ["lower(coalesce(sex, ''))"],
    "last_visit": ["last_visit"],
}

_PATIENT_ROWS = """
    SELECT
        p.patient_id, p.student_id, p.first_name, p.last_name, p.department, p.level, p.sex,
        p.is_student, coalesce(p.archived, 0) AS archived,
        (SELECT MAX(v.visit_datetime) FROM visit_logs v WHERE v.patient_id = p.patient_id) AS last_visit,
        (SELECT COUNT(*) FROM visit_logs v
           WHERE v.patient_id = p.patient_id AND v.visit_datetime >= :frequent_since) AS recent_visits,
        (SELECT group_concat(a.allergy_name, ', ') FROM patient_allergies pa
           JOIN allergies a ON a.allergy_id = pa.allergy_id WHERE pa.patient_id = p.patient_id) AS allergies,
        (SELECT COUNT(*) FROM patient_conditions pc WHERE pc.patient_id = p.patient_id) AS condition_count,
        CASE WHEN coalesce(p.emergency_contact_phone, '') = '' OR coalesce(p.birthday, '') = ''
             THEN 1 ELSE 0 END AS missing_info
    FROM patients p
"""

_SEARCH = (
    "(lower(coalesce(first_name, '') || ' ' || coalesce(last_name, '')) LIKE :like ESCAPE '!'"
    " OR lower(coalesce(student_id, '')) LIKE :like ESCAPE '!')"
)


def search_patients(query="", page=1, page_size=10, filters=None, sort="patient_id", direction="asc"):
    """One page of patients for the list, with the flags it shows, plus totals for the stat cards.

    filters (all optional): department, level, sex ("male"/"female"), patient_type
    ("student"/"other"), has_allergies, has_conditions, visited_within (days),
    flag ("frequent"/"missing_info"), archived (True shows only archived patients).
    """
    filters = filters or {}
    escaped = query.strip().lower().replace("!", "!!").replace("%", "!%").replace("_", "!_")
    params = {
        "like": f"%{escaped}%",
        "frequent_since": (date.today() - timedelta(days=FREQUENT_WINDOW_DAYS)).isoformat(),
        "frequent": FREQUENT_VISITS,
    }
    clauses = [_SEARCH, "archived = 1" if filters.get("archived") else "archived = 0"]
    if filters.get("department"):
        clauses.append("department = :department")
        params["department"] = filters["department"]
    if filters.get("level") not in (None, ""):
        clauses.append("CAST(level AS TEXT) = :level")
        params["level"] = str(filters["level"])
    if filters.get("sex") in ("male", "female"):
        clauses.append("lower(coalesce(sex, '')) LIKE :sex")
        params["sex"] = filters["sex"][0] + "%"
    if filters.get("patient_type") == "student":
        clauses.append("is_student = 1")
    elif filters.get("patient_type") == "other":
        clauses.append("coalesce(is_student, 0) = 0")
    if filters.get("has_allergies"):
        clauses.append("allergies IS NOT NULL")
    if filters.get("has_conditions"):
        clauses.append("condition_count > 0")
    if filters.get("visited_within"):
        clauses.append("last_visit >= :visited_since")
        params["visited_since"] = (date.today() - timedelta(days=int(filters["visited_within"]))).isoformat()
    if filters.get("flag") == "frequent":
        clauses.append("recent_visits >= :frequent")
    elif filters.get("flag") == "missing_info":
        clauses.append("missing_info = 1")

    way = "DESC" if direction == "desc" else "ASC"
    order_parts = [f"{column} {way}" for column in SORTS.get(sort, SORTS["patient_id"])]
    if sort == "last_visit":
        order_parts.insert(0, "last_visit IS NULL")  # never-visited patients last, either way
    order_sql = ", ".join(order_parts + ["patient_id"])

    where = " AND ".join(clauses)
    base = f"WITH rows AS ({_PATIENT_ROWS})"
    total = getprocess(f"{base} SELECT COUNT(*) AS n FROM rows WHERE {where}", params)[0]["n"]
    patients = getprocess(
        f"{base} SELECT * FROM rows WHERE {where} ORDER BY {order_sql} LIMIT :limit OFFSET :offset",
        {**params, "limit": page_size, "offset": (page - 1) * page_size},
    )
    for row in patients:
        row["frequent_visitor"] = row["recent_visits"] >= FREQUENT_VISITS

    stats = getprocess(
        f"""{base}
        SELECT
            coalesce(SUM(archived = 0), 0) AS total,
            COUNT(DISTINCT CASE WHEN archived = 0 THEN NULLIF(department, '') END) AS departments,
            coalesce(SUM(archived = 0 AND lower(sex) LIKE 'm%'), 0) AS male,
            coalesce(SUM(archived = 0 AND lower(sex) LIKE 'f%'), 0) AS female,
            coalesce(SUM(archived = 0 AND missing_info = 1), 0) AS missing_info,
            coalesce(SUM(archived = 0 AND recent_visits >= :frequent), 0) AS frequent,
            coalesce(SUM(archived = 1), 0) AS archived
        FROM rows
        """,
        params,
    )[0]
    departments = [
        row["department"] for row in getprocess(
            "SELECT DISTINCT department FROM patients WHERE coalesce(department, '') != '' ORDER BY department", []
        )
    ]
    return {
        "patients": patients, "total": total, "page": page, "page_size": page_size,
        "stats": stats, "departments": departments,
    }


def check_in_lookup(student_id):
    """For the check-in box: the existing patient with this ID, else the registry entry
    to start a new patient from, else nothing."""
    student_id = (student_id or "").strip()
    if not student_id:
        return {"status": "not_found"}
    patients = getprocess(
        """SELECT patient_id, student_id, first_name, last_name, coalesce(archived, 0) AS archived
           FROM patients WHERE lower(student_id) = lower(?)""",
        [student_id],
    )
    if patients:
        return {"status": "patient", "patient": patients[0]}
    students = get_student(student_id=student_id)
    if students:
        return {"status": "student", "student": students[0]}
    return {"status": "not_found"}


def patient_timeline(patient_id):
    """Everything that happened to a patient, newest first, plus vitals for the chart."""
    visits = getprocess(
        """
        SELECT v.visit_id, v.visit_datetime AS at, v.notes, v.complaint, v.assessment, v.treatment,
               v.Weight AS weight, v.Temperature AS temperature, s.service_name,
               st.first_name || ' ' || st.last_name AS staff_name,
               (SELECT group_concat(m.quantity || ' x ' || su.supply_name, ', ')
                  FROM medication_details m JOIN supplies su ON su.supply_id = m.supply_id
                 WHERE m.visit_id = v.visit_id) AS medicines
        FROM visit_logs v
        JOIN services s ON s.service_id = v.service_id
        LEFT JOIN staff st ON st.staff_id = v.staff_id
        WHERE v.patient_id = ?
        """,
        [patient_id],
    )
    appointments = getprocess(
        """
        SELECT a.appointment_id, a.appointment_date || ' ' || coalesce(a.start_time, '') AS at,
               a.status, s.service_name
        FROM appointments a LEFT JOIN services s ON s.service_id = a.service_id
        WHERE a.patient_id = ?
        """,
        [patient_id],
    )
    # Changes to the record come from the audit log, which keeps who and when, not values.
    changes = getprocess(
        """
        SELECT created_at AS at, action, username
        FROM audit_logs
        WHERE success = 1
          AND action IN ('patient_create', 'patient_update', 'patient_allergy_add', 'patient_allergy_delete',
                         'patient_condition_add', 'patient_condition_delete', 'patient_archive')
          AND CAST(json_extract(details, '$.ids.patient_id') AS TEXT) = CAST(? AS TEXT)
        """,
        [patient_id],
    )
    events = (
        [{"type": "visit", **row} for row in visits]
        + [{"type": "appointment", **row} for row in appointments]
        + [{"type": "change", **row} for row in changes]
    )
    events.sort(key=lambda event: str(event["at"] or ""), reverse=True)

    vitals = []
    for visit in sorted(visits, key=lambda v: str(v["at"])):
        weight, temperature = _number(visit["weight"]), _number(visit["temperature"])
        if weight is not None or temperature is not None:
            vitals.append({"date": str(visit["at"])[:10], "weight": weight, "temperature": temperature})
    return {"events": events, "vitals": vitals}


def patient_summary(patient_id):
    """What a referral letter or a parent needs: who, allergies, conditions, recent care."""
    patients = getprocess(
        """SELECT patient_id, student_id, first_name, middle_name, last_name, birthday, sex,
                  department, level, phone, email, emergency_contact_name, emergency_contact_phone, notes
           FROM patients WHERE patient_id = ?""",
        [patient_id],
    )
    if not patients:
        return None
    recent = [event for event in patient_timeline(patient_id)["events"] if event["type"] == "visit"][:10]
    return {
        "patient": patients[0],
        "allergies": [row["allergy_name"] for row in get_patient_allergies(patient_id=patient_id)],
        "conditions": [row["condition_name"] for row in get_patient_conditions(patient_id=patient_id)],
        "recent_visits": recent,
    }


def set_patient_archived(patient_id, archived):
    return updaterecord("patients", patient_id=patient_id, archived=1 if archived else 0)


def _number(value):
    try:
        return float(str(value).strip().split()[0])
    except (ValueError, IndexError):
        return None


def get_patient(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())

    sql = f"SELECT * FROM {table} WHERE `{keys[0]}` = ?"
    return getprocess(sql, values)


def get_patient_allergies(**kwargs):
    values = list(kwargs.values())
    sql = """
        SELECT
            pa.allergy_id,
            a.allergy_name
        FROM patient_allergies pa
        JOIN allergies a on a.allergy_id = pa.allergy_id
        WHERE pa.patient_id = ?
    """
    return getprocess(sql, values)


def get_patient_conditions(**kwargs):
    values = list(kwargs.values())
    sql = """
        SELECT
            pc.condition_id,
            c.condition_name
        FROM patient_conditions pc
        JOIN conditions c on c.condition_id = pc.condition_id
        WHERE pc.patient_id = ?
    """
    return getprocess(sql, values)


def add_patient(allergies=(), conditions=(), **fields):
    """Saves the patient with their allergies and conditions, all or nothing.
    Returns the new patient_id, or None if anything failed."""
    keys = list(fields.keys())
    values = list(fields.values())
    try:
        checked_columns("patients", keys)
    except ValueError as e:
        print("POST error:", e)
        return None

    columns = "`,`".join(keys)
    placeholders = ",".join(["?"] * len(values))
    conn = connect(database)
    try:
        conn.execute("PRAGMA foreign_keys = ON;")
        with conn:  # commits on success, rolls back on any error
            patient_id = conn.execute(
                f"INSERT INTO patients (`{columns}`) VALUES ({placeholders})", values
            ).lastrowid
            conn.executemany(
                "INSERT INTO patient_allergies (patient_id, allergy_id) VALUES (?, ?)",
                [(patient_id, allergy_id) for allergy_id in allergies],
            )
            conn.executemany(
                "INSERT INTO patient_conditions (patient_id, condition_id) VALUES (?, ?)",
                [(patient_id, condition_id) for condition_id in conditions],
            )
        return patient_id
    except REJECTED_WRITE as e:
        print("Write refused:", e)
        return None
    finally:
        conn.close()


def add_allergy(**fields):
    return addrecord("allergies", **fields)


def add_condition(**fields):
    return addrecord("conditions", **fields)


def add_patient_allergy(patient_id, allergy_id):
    return addrecord("patient_allergies", patient_id=patient_id, allergy_id=allergy_id)


def add_patient_condition(patient_id, condition_id):
    return addrecord("patient_conditions", patient_id=patient_id, condition_id=condition_id)


def delete_patient_allergy(patient_id, allergy_id):
    return deletemedical("patient_allergies", patient_id=patient_id, allergy_id=allergy_id)


def delete_patient_condition(patient_id, condition_id):
    return deletemedical("patient_conditions", patient_id=patient_id, condition_id=condition_id)


def update_patient(patient_id, **fields):
    return updaterecord("patients", patient_id=patient_id, **fields)
