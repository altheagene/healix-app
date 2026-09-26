"""Visit routes. Reads the request, calls the visit model, and returns JSON."""

from flask import Blueprint, jsonify, request

from models.visit_model import (
    add_medications_for_visit,
    add_visit_log,
    get_clinic_visits,
    get_medication_details,
    get_patient_clinic_logs,
    get_visit_logs,
    replace_visit_medications,
    update_visit_log,
)
from views.api_view import json_data, json_error, json_success
from views.report_view import clinic_visits_csv

visit_bp = Blueprint("visits", __name__)


@visit_bp.route("/clinic_visits", methods=["GET"])
def clinic_visits():
    return json_data(get_clinic_visits(
        from_date=request.args.get("fromdate"),
        to_date=request.args.get("todate"),
    ))


@visit_bp.route("/getpatientcliniclogs", methods=["GET"])
def patient_clinic_logs():
    patient_id = request.args.get("idnum")
    return json_data(get_patient_clinic_logs(patient_id=patient_id))


@visit_bp.route("/getmedicationdetails")
def medication_details():
    visit_id = request.args.get("idnum")
    return json_data(get_medication_details(visit_id=visit_id))


@visit_bp.route("/getvisitlogs", methods=["GET"])
def visit_logs():
    return json_data(get_visit_logs())


@visit_bp.route("/addvisitlog", methods=["POST"])
def add_visit_log_route():
    data = request.get_json() or {}
    visit_id = add_visit_log(**data)
    if not visit_id:
        return json_error("Could not save the visit", 500)
    return jsonify({"success": True, "visit_id": visit_id})


@visit_bp.route("/addmedicationdetails", methods=["POST"])
def add_medication_details():
    data = request.get_json() or {}
    visit_id = data.get("visit_id") if isinstance(data, dict) else None
    medications = data.get("medications", []) if isinstance(data, dict) else []
    if not visit_id:
        return json_error("visit_id is required")
    return json_success(add_medications_for_visit(visit_id, medications))


@visit_bp.route("/updatevisitlog", methods=["POST"])
def update_visit_log_route():
    data = request.get_json()
    update_visit_log(
        visit_id=data.get("visit_id"),
        weight=data.get("weight"),
        temperature=data.get("temperature"),
        service_id=data.get("service_id"),
        staff_id=data.get("staff_id"),
        notes=data.get("notes"),
    )
    return json_success(True)


@visit_bp.route("/updatemedicationdetails", methods=["POST"])
def update_medication_details():
    data = request.get_json()
    visit_id = data.get("visit_id")
    medications = data.get("medications", [])

    if not visit_id:
        return json_error("visit_id is required")

    return json_success(replace_visit_medications(visit_id, medications))


@visit_bp.route("/generateclinicreport", methods=["GET"])
def generate_clinic_report():
    visits = get_clinic_visits(
        from_date=request.args.get("fromdate"),
        to_date=request.args.get("todate"),
    )
    return clinic_visits_csv(visits)
