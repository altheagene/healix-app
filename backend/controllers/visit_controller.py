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
    update_visit,
)
import validation
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
    data = dict(request.get_json() or {})
    # Medicines are saved with the visit, so stock is never deducted for a visit that failed.
    medications = validation.medications(data.pop("medications", None))
    validation.require(data, "patient_id", "service_id", "staff_id", "visit_datetime")
    visit_id = add_visit_log(medications=medications, **data)
    if not visit_id:
        return json_error("Could not save the visit", 400)
    return jsonify({"success": True, "visit_id": visit_id})


@visit_bp.route("/addmedicationdetails", methods=["POST"])
def add_medication_details():
    data = request.get_json() or {}
    validation.require(data, "visit_id")
    medications = validation.medications(data.get("medications"))
    return json_success(add_medications_for_visit(data["visit_id"], medications))


@visit_bp.route("/updatevisitlog", methods=["POST"])
def update_visit_log_route():
    data = request.get_json() or {}
    validation.require(data, "visit_id")
    # Only fields the form sent are changed, so an older form cannot blank newer ones.
    editable = ("service_id", "staff_id", "notes", "complaint", "assessment", "treatment")
    fields = {key: data[key] for key in editable if key in data}
    # The edit form has always sent Weight/Temperature capitalised; reading only the
    # lowercase keys used to wipe both values on every edit.
    for key in ("weight", "temperature"):
        for sent in (key, key.capitalize()):
            if sent in data:
                fields[key] = data[sent]
    # When the form sends medicines too, they are replaced in the same transaction.
    medications = validation.medications(data["medications"]) if "medications" in data else None
    return json_success(update_visit(data["visit_id"], fields, medications))


@visit_bp.route("/updatemedicationdetails", methods=["POST"])
def update_medication_details():
    data = request.get_json() or {}
    validation.require(data, "visit_id")
    medications = validation.medications(data.get("medications"))
    return json_success(replace_visit_medications(data["visit_id"], medications))


@visit_bp.route("/generateclinicreport", methods=["GET"])
def generate_clinic_report():
    visits = get_clinic_visits(
        from_date=request.args.get("fromdate"),
        to_date=request.args.get("todate"),
    )
    return clinic_visits_csv(visits)
