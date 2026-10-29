"""Builds downloadable CSV files. The controller supplies the rows."""

import csv
import io

from flask import Response

from models.inventory_model import REASONS


def _safe(value):
    """Quote-safe text, with a leading ' on anything a spreadsheet would run as a formula."""
    text = "" if value is None else str(value)
    return "'" + text if text[:1] in ("=", "+", "-", "@", "\t", "\r") else text


def _csv_response(filename, headers, records):
    def generate():
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(headers)
        for record in records:
            writer.writerow([_safe(col) for col in record])
            yield buffer.getvalue()
            buffer.seek(0)
            buffer.truncate()
        yield buffer.getvalue()

    return Response(
        generate(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename={filename}"},
    )


def visits_csv(visits, dispositions):
    headers = ["Visit ID", "Date and time", "Patient", "Student ID", "Department", "Level", "Strand",
               "Service", "Complaint", "Outcome", "Referred or taken to", "Time in", "Time out",
               "Parent notified", "Attending"]
    rows = [
        [v["visit_id"], v["visit_datetime"], v["patient_name"], v["student_id"], v["department"], v["level"],
         v["strand"], v["service_name"], v["complaint"],
         dispositions.get(v["disposition"], "In clinic" if v["time_in"] and not v["time_out"] else ""),
         v["referred_to"], v["time_in"], v["time_out"], "Yes" if v["parent_notified"] else "No", v["staff_name"]]
        for v in visits
    ]
    return _csv_response("visits.csv", headers, rows)


def appointments_csv(appointments):
    headers = [
        "Appointment ID",
        "Date",
        "Start Time",
        "Status",
        "Notes",
        "Service ID",
        "Service Name",
        "Patient ID",
        "Patient Name",
    ]
    rows = [
        [
            str(appt["appointment_id"]),
            str(appt["appointment_date"]),
            str(appt["start_time"]),
            appt["status"] or "",
            appt["Notes"] or "",
            str(appt["service_id"]),
            appt["service_name"] or "",
            str(appt["patient_id"]),
            appt["patient_name"] or "",
        ]
        for appt in appointments
    ]
    return _csv_response("appointments_report.csv", headers, rows)


def appointment_logs_csv(logs):
    headers = [
        "Appointment ID",
        "Service ID",
        "Service Name",
        "Appointment Date",
        "Start Time",
        "Status",
        "Patient ID",
        "Patient Name",
    ]
    rows = [
        [
            str(log["appointment_id"]),
            str(log["service_id"]),
            log["service_name"] or "",
            str(log["appointment_date"]),
            str(log["start_time"]),
            log["status"] or "",
            str(log["patient_id"]),
            log["patient_name"] or "",
        ]
        for log in logs
    ]
    return _csv_response("appointment_logs.csv", headers, rows)


def inventory_logs_csv(logs):
    headers = [
        "Inventory ID", "Date and time", "Supply", "Unit", "Batch Number", "Expiration Date",
        "Item In", "Item Out", "Reason", "Note", "Visit ID", "Recorded by",
    ]
    rows = [
        [
            str(log["inv_id"]),
            log["moved_at"] or "",
            log["supply_name"] or "",
            log["unit"] or "",
            log["batch_number"] or "",
            log["expiration_date"] or "",
            str(log["item_in"]),
            str(log["item_out"]),
            REASONS.get(log["reason"], log["reason"] or "Not recorded"),
            log["note"] or "",
            str(log["visit_id"] or ""),
            log["staff_name"] or "",
        ]
        for log in logs
    ]
    return _csv_response("inventory_logs.csv", headers, rows)


def clinic_visits_csv(visits):
    headers = [
        "Visit ID",
        "Visit Datetime",
        "Notes",
        "Service ID",
        "Service Name",
        "Patient ID",
        "Patient Name",
        "Staff ID",
        "Staff Name",
    ]
    rows = [
        [
            str(visit["visit_id"]),
            str(visit["visit_datetime"]),
            visit["notes"] or "",
            str(visit["service_id"]),
            visit["service_name"] or "",
            str(visit["patient_id"]),
            visit["patient_name"] or "",
            str(visit["staff_id"]),
            visit["staff_name"] or "",
        ]
        for visit in visits
    ]
    return _csv_response("clinic_visit_report.csv", headers, rows)
