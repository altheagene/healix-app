"""Appointment queries. This file talks to SQLite and does not know about HTTP."""

from db.connection import getprocess, postprocess
from db.dbhelper import addrecord, updaterecord


def list_appointments():
    sql = """
    SELECT
        a.appointment_id,
        a.appointment_date,
        a.start_time,
        a.status,
        a.notes,
        s.service_id,
        s.service_name,
        p.patient_id,
        p.first_name || ' ' || p.middle_name || ' ' || p.last_name AS patient_name
        FROM
            appointments a
        JOIN
            services s ON a.service_id = s.service_id
        JOIN
            patients p ON a.patient_id = p.patient_id
        ORDER BY a.appointment_date, a.start_time
        """
    return getprocess(sql, [])


def list_appointments_today():
    sql = """
        SELECT *
        FROM appointments
        WHERE appointment_date LIKE date('now');
    """
    return getprocess(sql, [])


def list_appointment_logs(**kwargs):
    values = list(kwargs.values())
    sql = """
        SELECT
        a.appointment_id,
        a.service_id,
        s.service_name,
        a.appointment_date,
        a.start_time,
        a.status,
        p.patient_id,
        p.first_name || ' ' || p.middle_name || ' ' || p.last_name AS patient_name
    FROM appointments a
    JOIN services s ON s.service_id = a.service_id
    JOIN patients p ON a.patient_id = p.patient_id
    WHERE DATE(a.appointment_date) BETWEEN ? AND ?
    ORDER BY a.appointment_date DESC;

    """
    return getprocess(sql, values)


def add_appointment(**fields):
    return addrecord("appointments", **fields)


def update_appointment_record(**fields):
    return updaterecord("appointments", **fields)


def update_appointment_details(appointment_id, **fields):
    keys = list(fields.keys())
    values = list(fields.values())

    assignments = []
    for key in keys:
        assignments.append(f"`{key}` = ?")

    sql = f"""
            UPDATE appointments
            SET {",".join(assignments)}
            WHERE `appointment_id` = ?
           """
    return postprocess(sql, [*values, appointment_id])
