"""The Reports page: what happened in the clinic over a period, for the school office.
This file talks to SQLite and does not know about HTTP."""

from datetime import date, timedelta

from db.connection import getprocess
from models.inventory_model import inventory_alerts
from models.visit_search_model import PATIENT_NAME_SQL
from school import BASIC_EDUCATION, STAGES

LEAVES_SCHOOL = ("sent_home", "referred", "emergency")
_IN_RANGE = "substr(v.visit_datetime, 1, 10) BETWEEN :date_from AND :date_to"


def _rows(sql, params):
    return getprocess(sql, params)


def _stage_name(level):
    for _, (name, levels) in STAGES.items():
        if level in levels:
            return name
    return BASIC_EDUCATION


def _visit_count(date_from, date_to):
    return _rows(f"SELECT COUNT(*) AS n FROM visit_logs v WHERE {_IN_RANGE}",
                 {"date_from": date_from, "date_to": date_to})[0]["n"]


def clinic_report(date_from, date_to):
    params = {"date_from": date_from, "date_to": date_to}

    totals = _rows(
        f"""
        SELECT COUNT(*) AS visits,
               COUNT(DISTINCT v.patient_id) AS students,
               COUNT(DISTINCT substr(v.visit_datetime, 1, 10)) AS days_open,
               coalesce(SUM(v.disposition IN {LEAVES_SCHOOL}), 0) AS left_school,
               coalesce(SUM(v.disposition IN {LEAVES_SCHOOL} AND v.parent_notified = 1), 0) AS parents_told
        FROM visit_logs v WHERE {_IN_RANGE}
        """,
        params,
    )[0]
    totals["repeat_students"] = _rows(
        f"""SELECT COUNT(*) AS n FROM (SELECT v.patient_id FROM visit_logs v WHERE {_IN_RANGE}
            GROUP BY v.patient_id HAVING COUNT(*) > 1)""",
        params,
    )[0]["n"]

    # The same number of days just before, so the page can say "up 12% on the period before".
    start, end = date.fromisoformat(date_from), date.fromisoformat(date_to)
    length = (end - start).days + 1
    previous_end = start - timedelta(days=1)
    totals["previous_visits"] = _visit_count((previous_end - timedelta(days=length - 1)).isoformat(),
                                             previous_end.isoformat())

    medicines = _rows(
        """
        SELECT s.supply_id, s.supply_name, s.unit, SUM(i.item_out) AS units, COUNT(DISTINCT i.visit_id) AS visits
        FROM inventory i
        JOIN batches b ON b.batch_id = i.batch_id
        JOIN supplies s ON s.supply_id = b.supply_id
        WHERE i.reason = 'dispensed' AND i.inv_date BETWEEN :date_from AND :date_to
        GROUP BY s.supply_id ORDER BY units DESC, s.supply_name LIMIT 8
        """,
        params,
    )
    totals["units_given"] = sum(row["units"] for row in medicines)

    outcomes = _rows(
        f"""
        SELECT CASE WHEN v.disposition IS NOT NULL THEN v.disposition
                    WHEN v.time_in IS NOT NULL AND v.time_out IS NULL THEN 'in_clinic'
                    ELSE 'unrecorded' END AS outcome,
               COUNT(*) AS visits
        FROM visit_logs v WHERE {_IN_RANGE}
        GROUP BY outcome ORDER BY visits DESC
        """,
        params,
    )

    # Free text, so "Fever" and "fever " count together under one of their spellings.
    complaints = _rows(
        f"""
        SELECT lower(trim(v.complaint)) AS key, MIN(trim(v.complaint)) AS complaint, COUNT(*) AS visits
        FROM visit_logs v WHERE {_IN_RANGE} AND trim(coalesce(v.complaint, '')) != ''
        GROUP BY key ORDER BY visits DESC, key LIMIT 8
        """,
        params,
    )

    groups = {}
    for row in _rows(
        f"""SELECT p.department, p.level, COUNT(*) AS visits FROM visit_logs v
            JOIN patients p ON p.patient_id = v.patient_id WHERE {_IN_RANGE}
            GROUP BY p.department, p.level""",
        params,
    ):
        department = row["department"] or "Not recorded"
        name = _stage_name(row["level"]) if department == BASIC_EDUCATION else department
        groups[name] = groups.get(name, 0) + row["visits"]
    by_group = sorted(({"group": name, "visits": n} for name, n in groups.items()), key=lambda g: -g["visits"])

    hours = {row["hour"]: row["visits"] for row in _rows(
        f"""SELECT CAST(substr(v.visit_datetime, 12, 2) AS INTEGER) AS hour, COUNT(*) AS visits
            FROM visit_logs v WHERE {_IN_RANGE} GROUP BY hour""",
        params,
    )}
    # School hours always show, so a quiet hour reads as zero rather than missing.
    by_hour = [{"hour": hour, "visits": hours.get(hour, 0)}
               for hour in range(min([7, *hours]), max([17, *hours]) + 1)]

    days = {row["day"]: row["visits"] for row in _rows(
        f"""SELECT substr(v.visit_datetime, 1, 10) AS day, COUNT(*) AS visits
            FROM visit_logs v WHERE {_IN_RANGE} GROUP BY day""",
        params,
    )}
    every_day = [(start + timedelta(days=n)).isoformat() for n in range(min(length, 400))]
    by_day = [{"day": day, "visits": days.get(day, 0)} for day in every_day]

    frequent = _rows(
        f"""
        SELECT v.patient_id, {PATIENT_NAME_SQL} AS patient_name, p.student_id, p.department, p.level, p.strand,
               COUNT(*) AS visits, MAX(v.visit_datetime) AS last_visit,
               (SELECT v2.complaint FROM visit_logs v2 WHERE v2.patient_id = v.patient_id
                  AND substr(v2.visit_datetime, 1, 10) BETWEEN :date_from AND :date_to
                ORDER BY v2.visit_datetime DESC LIMIT 1) AS last_complaint
        FROM visit_logs v JOIN patients p ON p.patient_id = v.patient_id
        WHERE {_IN_RANGE}
        GROUP BY v.patient_id HAVING COUNT(*) > 1
        ORDER BY visits DESC, last_visit DESC LIMIT 8
        """,
        params,
    )

    alerts = inventory_alerts(30)
    return {
        "date_from": date_from, "date_to": date_to,
        "totals": totals, "outcomes": outcomes, "complaints": complaints, "by_group": by_group,
        "by_hour": by_hour, "by_day": by_day, "medicines": medicines, "frequent": frequent,
        "stock": {
            "expiring": alerts["expiring"][:5], "expiring_count": len(alerts["expiring"]),
            "to_dispose": alerts["to_dispose"][:5], "to_dispose_count": len(alerts["to_dispose"]),
            "reorder": alerts["reorder"][:5], "reorder_count": len(alerts["reorder"]),
        },
    }
