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
from models.visit_outcome_model import (
    DISPOSITIONS,
    NOTIFY_METHODS,
    notify_parent,
    now_local,
    open_visits,
    record_outcome,
    visit_exists,
)
import validation
from views.api_view import json_data, json_error, json_success
from models.visit_search_model import get_visit, search_visits, visits_for_export
from views.report_view import clinic_visits_csv, visits_csv

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
    # The student is in the clinic from now until an outcome is recorded.
    data.setdefault("time_in", data["visit_datetime"])
    if data.get("disposition"):
        _check_outcome(data)
        data.setdefault("time_out", now_local())
    else:
        for key in ("disposition", "referred_to", "picked_up_by", "picked_up_at", "time_out"):
            data.pop(key, None)
    visit_id = add_visit_log(medications=medications, moved_by=request.staff["staff_id"], **data)
    if not visit_id:
        return json_error("Could not save the visit", 400)
    return jsonify({"success": True, "visit_id": visit_id})


def _check_outcome(data):
    if data.get("disposition") not in DISPOSITIONS:
        raise validation.ValidationError(f"disposition must be one of: {', '.join(DISPOSITIONS)}")
    if data["disposition"] in ("referred", "emergency") and not (data.get("referred_to") or "").strip():
        raise validation.ValidationError("Say where the student was referred or taken")
    if data["disposition"] == "sent_home" and not (data.get("picked_up_by") or "").strip():
        raise validation.ValidationError("Say who picked the student up")


def _visit_filters(args):
    return {
        "q": args.get("q"),
        "date_from": validation.iso_date(args["date_from"], "date_from") if args.get("date_from") else None,
        "date_to": validation.iso_date(args["date_to"], "date_to") if args.get("date_to") else None,
        "outcome": args.get("outcome") or None,
        "service_id": args.get("service_id") or None,
        "staff_id": args.get("staff_id") or None,
        "department": args.get("department") or None,
        "stage": args.get("stage") or None,
    }


@visit_bp.route("/searchvisits", methods=["GET"])
def search_visits_route():
    args = request.args
    page = validation.non_negative_int(args.get("page", "1"), "page") or 1
    page_size = min(validation.non_negative_int(args.get("page_size", "20"), "page_size") or 20, 200)
    return json_data(search_visits(
        _visit_filters(args), DISPOSITIONS, page, page_size,
        sort=args.get("sort", "date"), direction=args.get("direction", "desc"),
    ))


@visit_bp.route("/getvisit", methods=["GET"])
def get_visit_route():
    visit = get_visit(request.args.get("idnum"))
    if visit is None:
        return json_error("No such visit", 404)
    return json_data(visit)


@visit_bp.route("/download/visits", methods=["GET"])
def download_visits_route():
    return visits_csv(visits_for_export(_visit_filters(request.args), DISPOSITIONS), DISPOSITIONS)


@visit_bp.route("/clinicnow", methods=["GET"])
def clinic_now_route():
    return json_data(open_visits())


@visit_bp.route("/visitoutcome", methods=["POST"])
def visit_outcome_route():
    data = request.get_json() or {}
    validation.require(data, "visit_id", "disposition")
    _check_outcome(data)
    if not visit_exists(data["visit_id"]):
        return json_error("No such visit", 404)
    return json_success(record_outcome(
        data["visit_id"],
        data["disposition"],
        time_out=data.get("time_out"),
        referred_to=(data.get("referred_to") or "").strip() or None,
        picked_up_by=(data.get("picked_up_by") or "").strip() or None,
        picked_up_at=data.get("picked_up_at"),
    ))


@visit_bp.route("/notifyparent", methods=["POST"])
def notify_parent_route():
    data = request.get_json() or {}
    validation.require(data, "visit_id", "method")
    if data["method"] not in NOTIFY_METHODS:
        raise validation.ValidationError(f"method must be one of: {', '.join(NOTIFY_METHODS)}")
    if not visit_exists(data["visit_id"]):
        return json_error("No such visit", 404)
    return json_success(notify_parent(data["visit_id"], data["method"], request.staff.get("username")))


@visit_bp.route("/addmedicationdetails", methods=["POST"])
def add_medication_details():
    data = request.get_json() or {}
    validation.require(data, "visit_id")
    medications = validation.medications(data.get("medications"))
    return json_success(add_medications_for_visit(data["visit_id"], medications, request.staff["staff_id"]))


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
    return json_success(update_visit(data["visit_id"], fields, medications, request.staff["staff_id"]))


@visit_bp.route("/updatemedicationdetails", methods=["POST"])
def update_medication_details():
    data = request.get_json() or {}
    validation.require(data, "visit_id")
    medications = validation.medications(data.get("medications"))
    return json_success(replace_visit_medications(data["visit_id"], medications, request.staff["staff_id"]))


@visit_bp.route("/generateclinicreport", methods=["GET"])
def generate_clinic_report():
    visits = get_clinic_visits(
        from_date=request.args.get("fromdate"),
        to_date=request.args.get("todate"),
    )
    return clinic_visits_csv(visits)
