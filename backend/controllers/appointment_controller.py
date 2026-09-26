"""Appointment routes. Reads the request, calls the model, and returns JSON or CSV."""

from flask import Blueprint, request

from models.appointment_model import (
    add_appointment,
    list_appointment_logs,
    list_appointments,
    list_appointments_today,
    update_appointment_details,
    update_appointment_record,
)
from views.api_view import json_data, json_success
from views.report_view import appointment_logs_csv, appointments_csv

appointment_bp = Blueprint("appointments", __name__)


@appointment_bp.route("/getallappointments", methods=["GET"])
def get_all_appointments():
    return json_data(list_appointments())


@appointment_bp.route("/getappointmentstoday", methods=["GET"])
def get_appointments_today():
    return json_data(list_appointments_today())


@appointment_bp.route("/getapptlogs")
def get_appointment_logs():
    return json_data(list_appointment_logs(
        from_date=request.args.get("fromdate"),
        to_date=request.args.get("todate"),
    ))


@appointment_bp.route("/addappointment", methods=["POST"])
def add_appointment_route():
    data = request.get_json()
    return json_success(add_appointment(**data))


@appointment_bp.route("/updateappointment", methods=["POST"])
def update_appointment():
    data = request.get_json()
    return json_success(update_appointment_record(**data))


@appointment_bp.route("/updateappointmentdetails", methods=["POST"])
def update_appointment_details_route():
    data = request.get_json()
    appointment_id = data["appointment_id"]
    del data["appointment_id"]
    del data["patient_name"]
    del data["service_name"]
    return json_success(update_appointment_details(appointment_id, **data))


@appointment_bp.route("/download/appointments", methods=["GET"])
def download_appointments():
    return appointments_csv(list_appointments())


@appointment_bp.route("/download/appointmentlogs", methods=["GET"])
def download_appointment_logs():
    logs = list_appointment_logs(
        from_date=request.args.get("fromdate"),
        to_date=request.args.get("todate"),
    )
    return appointment_logs_csv(logs)
