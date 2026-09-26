"""Visit routes. Reads the request, calls the visit model, and returns JSON."""

from flask import Blueprint, request

from models.visit_model import (
    add_medication_detail,
    add_visit_log,
    deduct_batch,
    delete_visit_medications,
    get_clinic_visits,
    get_medication_details,
    get_patient_clinic_logs,
    get_visit_logs,
    latest_visit_id,
    update_visit_log,
)
from views.api_view import json_data, json_error, json_success

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
    data = request.get_json()
    return json_success(add_visit_log(**data))


@visit_bp.route("/addmedicationdetails", methods=["POST"])
def add_medication_details():
    data = request.get_json()
    latest = latest_visit_id()[0]["last_id"]
    for med in data:
        add_medication_detail(latest, med["supply_id"], med["quantity"])
        if med["auto_deduct"] == 1:
            deduct_batch(med["supply_id"], med["quantity"])
    return json_success(True)


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

    delete_visit_medications(visit_id)
    for med in medications:
        add_medication_detail(
            visit_id,
            med.get("supply_id"),
            med.get("quantity", 0),
        )

    return json_success(True)
