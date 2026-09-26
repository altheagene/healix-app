"""Builds downloadable CSV files. The controller supplies the rows."""

from flask import Response


def _csv_response(filename, headers, records):
    def generate():
        yield ",".join(headers) + "\n"
        for record in records:
            row = [f'"{col}"' if "," in col else col for col in record]
            yield ",".join(row) + "\n"

    return Response(
        generate(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename={filename}"},
    )


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
        "Inventory ID",
        "Inventory Date",
        "Batch ID",
        "Batch Number",
        "Expiration Date",
        "Supply ID",
        "Supply Name",
        "Item In",
        "Item Out",
        "Auto Update",
    ]
    rows = [
        [
            str(log["inv_id"]),
            str(log["inv_date"]),
            str(log["batch_id"]),
            log["batch_number"] or "",
            str(log["expiration_date"]),
            str(log["supply_id"]),
            log["supply_name"] or "",
            str(log["item_in"]),
            str(log["item_out"]),
            str(log["auto_update"]),
        ]
        for log in logs
    ]
    return _csv_response("inventory_logs.csv", headers, rows)
