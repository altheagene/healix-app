"""The Visit Records page: search, filter, sort and page visits on the server, so the
browser only ever receives one page of list columns, never everyone's notes."""

from datetime import date, timedelta

from db.connection import getprocess
from school import BASIC_EDUCATION, STAGES

# "Ana M Cruz", or "Ana Cruz" with no doubled space when the middle name is empty.
PATIENT_NAME_SQL = (
    "trim(coalesce(p.first_name, '') || ' ' || coalesce(nullif(trim(p.middle_name), '') || ' ', '')"
    " || coalesce(p.last_name, ''))"
)

OUTCOME_FILTERS = {
    "in_clinic": "v.time_in IS NOT NULL AND v.time_out IS NULL AND v.disposition IS NULL",
    "unrecorded": "v.time_in IS NULL AND v.disposition IS NULL",
}

SORTS = {
    "date": ["v.visit_datetime"],
    "patient": ["lower(p.last_name)", "lower(p.first_name)"],
    # Open visits first, then by outcome name, then visits with no outcome recorded.
    "outcome": [
        "coalesce(v.disposition, CASE WHEN v.time_in IS NOT NULL AND v.time_out IS NULL THEN '0' ELSE 'zz' END)"
    ],
}

_FROM = """
    FROM visit_logs v
    JOIN patients p ON p.patient_id = v.patient_id
    LEFT JOIN services s ON s.service_id = v.service_id
    LEFT JOIN staff st ON st.staff_id = v.staff_id
"""


def _filters(filters, dispositions):
    clauses, params = [], {}
    q = (filters.get("q") or "").strip().lower()
    if q:
        escaped = q.replace("!", "!!").replace("%", "!%").replace("_", "!_")
        params["like"] = f"%{escaped}%"
        clauses.append(
            f"(lower({PATIENT_NAME_SQL}) LIKE :like ESCAPE '!'"
            " OR lower(coalesce(p.student_id, '')) LIKE :like ESCAPE '!'"
            " OR lower(coalesce(v.complaint, '')) LIKE :like ESCAPE '!'"
            " OR CAST(v.visit_id AS TEXT) = :exact)"
        )
        params["exact"] = q.lstrip("#")
    if filters.get("date_from"):
        clauses.append("substr(v.visit_datetime, 1, 10) >= :date_from")
        params["date_from"] = filters["date_from"]
    if filters.get("date_to"):
        clauses.append("substr(v.visit_datetime, 1, 10) <= :date_to")
        params["date_to"] = filters["date_to"]
    outcome = filters.get("outcome")
    if outcome in OUTCOME_FILTERS:
        clauses.append(OUTCOME_FILTERS[outcome])
    elif outcome in dispositions:
        clauses.append("v.disposition = :outcome")
        params["outcome"] = outcome
    if filters.get("service_id"):
        clauses.append("v.service_id = :service_id")
        params["service_id"] = filters["service_id"]
    if filters.get("staff_id"):
        clauses.append("v.staff_id = :staff_id")
        params["staff_id"] = filters["staff_id"]
    if filters.get("department"):
        clauses.append("p.department = :department")
        params["department"] = filters["department"]
    if filters.get("stage") in STAGES:
        levels = list(STAGES[filters["stage"]][1])
        clauses.append(f"p.department = :basic_ed AND p.level BETWEEN {levels[0]} AND {levels[-1]}")
        params["basic_ed"] = BASIC_EDUCATION
    return (" WHERE " + " AND ".join(clauses)) if clauses else "", params


def search_visits(filters, dispositions, page=1, page_size=20, sort="date", direction="desc"):
    """One page of visits for the list, plus the counts for the stat cards and the
    choices for the service and staff filters. No notes or vitals: the list does not show them."""
    where, params = _filters(filters, dispositions)
    way = "ASC" if direction == "asc" else "DESC"
    order = ", ".join(f"{column} {way}" for column in SORTS.get(sort, SORTS["date"]))
    total = getprocess(f"SELECT COUNT(*) AS n {_FROM} {where}", params)[0]["n"]
    visits = getprocess(
        f"""
        SELECT v.visit_id, v.visit_datetime, v.patient_id, {PATIENT_NAME_SQL} AS patient_name,
               p.student_id, p.department, p.level, p.strand,
               s.service_name, v.complaint, v.disposition, v.referred_to, v.time_in, v.time_out,
               v.parent_notified, trim(coalesce(st.first_name, '') || ' ' || coalesce(st.last_name, '')) AS staff_name
        {_FROM} {where}
        ORDER BY {order}, v.visit_id DESC
        LIMIT :limit OFFSET :offset
        """,
        {**params, "limit": page_size, "offset": (page - 1) * page_size},
    )
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    stats = getprocess(
        f"""
        SELECT
            coalesce(SUM(substr(v.visit_datetime, 1, 10) = :today), 0) AS today,
            coalesce(SUM(substr(v.visit_datetime, 1, 10) >= :week_start), 0) AS this_week,
            coalesce(SUM({OUTCOME_FILTERS["in_clinic"]}), 0) AS in_clinic,
            coalesce(SUM(substr(v.visit_datetime, 1, 10) = :today
                         AND v.disposition IN ('sent_home', 'referred', 'emergency')), 0) AS left_school_today
        FROM visit_logs v
        """,
        {"today": today.isoformat(), "week_start": week_start.isoformat()},
    )[0]
    services = getprocess("SELECT service_id, service_name FROM services ORDER BY service_name", [])
    staff = getprocess(
        "SELECT DISTINCT st.staff_id, trim(st.first_name || ' ' || st.last_name) AS staff_name "
        "FROM visit_logs v JOIN staff st ON st.staff_id = v.staff_id ORDER BY staff_name",
        [],
    )
    return {
        "visits": visits, "total": total, "page": page, "page_size": page_size,
        "stats": stats, "services": services, "staff": staff,
    }


def get_visit(visit_id):
    """One visit in full, for the details dialog and for closing it."""
    rows = getprocess(
        f"""
        SELECT v.*, v.Weight, v.Temperature, {PATIENT_NAME_SQL} AS patient_name,
               p.first_name, p.last_name, p.student_id, p.department, p.level, p.strand,
               p.emergency_contact_name, p.emergency_contact_phone,
               s.service_name, trim(coalesce(st.first_name, '') || ' ' || coalesce(st.last_name, '')) AS staff_name
        {_FROM}
        WHERE v.visit_id = ?
        """,
        [visit_id],
    )
    return rows[0] if rows else None


def visits_for_export(filters, dispositions, limit=5000):
    where, params = _filters(filters, dispositions)
    return getprocess(
        f"""
        SELECT v.visit_id, v.visit_datetime, {PATIENT_NAME_SQL} AS patient_name, p.student_id, p.department,
               p.level, p.strand, s.service_name, v.complaint, v.disposition, v.referred_to,
               v.time_in, v.time_out, v.parent_notified,
               trim(coalesce(st.first_name, '') || ' ' || coalesce(st.last_name, '')) AS staff_name
        {_FROM} {where}
        ORDER BY v.visit_datetime DESC
        LIMIT :limit
        """,
        {**params, "limit": limit},
    )
