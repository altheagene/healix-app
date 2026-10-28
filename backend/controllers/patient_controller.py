"""Patient routes. Same URLs as before, now calling the patient model."""

from flask import Blueprint, jsonify, request

from models.patient_model import (
    add_allergy,
    add_condition,
    add_patient,
    add_patient_allergy,
    add_patient_condition,
    delete_patient_allergy,
    delete_patient_condition,
    find_student_record,
    get_allergies,
    get_all_patients,
    get_conditions,
    get_patient,
    get_patient_allergies,
    get_patient_conditions,
    check_in_lookup,
    get_student,
    patient_summary,
    patient_timeline,
    search_patients,
    set_patient_archived,
    update_patient,
)
from views.api_view import json_data, json_success
import validation
from school import level_problem

patient_bp = Blueprint("patients", __name__)


@patient_bp.route("/findstudent", methods=["GET"])
def find_student():
    idnum = request.args.get("idnum")
    return json_data(find_student_record("students", student_id=idnum))


@patient_bp.route("/getstudent", methods=["GET"])
def get_student_route():
    idnum = request.args.get("idnum")
    return json_data(get_student(student_id=idnum))


@patient_bp.route("/getallergies", methods=["GET"])
def get_allergies_route():
    return json_data(get_allergies("allergies"))


@patient_bp.route("/getconditions", methods=["GET"])
def get_conditions_route():
    return json_data(get_conditions("conditions"))


@patient_bp.route("/getallpatients", methods=["GET"])
def get_all_patients_route():
    return json_data(get_all_patients())


@patient_bp.route("/searchpatients", methods=["GET"])
def search_patients_route():
    args = request.args
    page = validation.non_negative_int(args.get("page", "1"), "page") or 1
    page_size = min(validation.non_negative_int(args.get("page_size", "10"), "page_size") or 10, 100)
    visited_within = args.get("visited_within")
    filters = {
        "department": args.get("department") or None,
        "level": args.get("level") or None,
        "stage": args.get("stage") or None,
        "sex": args.get("sex") or None,
        "patient_type": args.get("patient_type") or None,
        "has_allergies": args.get("has_allergies") == "1",
        "has_conditions": args.get("has_conditions") == "1",
        "visited_within": validation.non_negative_int(visited_within, "visited_within") if visited_within else None,
        "flag": args.get("flag") or None,
        "archived": args.get("archived") == "1",
    }
    return json_data(search_patients(
        args.get("q", ""), page, page_size, filters,
        sort=args.get("sort", "patient_id"), direction=args.get("direction", "asc"),
    ))


@patient_bp.route("/checkin", methods=["GET"])
def check_in_route():
    return json_data(check_in_lookup(request.args.get("student_id")))


@patient_bp.route("/patienttimeline", methods=["GET"])
def patient_timeline_route():
    return json_data(patient_timeline(request.args.get("idnum")))


@patient_bp.route("/patientsummary", methods=["GET"])
def patient_summary_route():
    summary = patient_summary(request.args.get("idnum"))
    if summary is None:
        return jsonify({"error": "No such patient"}), 404
    summary["generated_by"] = request.staff.get("username")
    return json_data(summary)


@patient_bp.route("/archivepatient", methods=["POST"])
def archive_patient_route():
    data = request.get_json() or {}
    validation.require(data, "patient_id")
    return json_success(set_patient_archived(data["patient_id"], bool(data.get("archived", True))))


@patient_bp.route("/getpatient", methods=["GET"])
def get_patient_route():
    patient_id = request.args.get("idnum")
    return json_data(get_patient("patients", patient_id=patient_id))


@patient_bp.route("/getpatientallergies", methods=["GET"])
def get_patient_allergies_route():
    patient_id = request.args.get("idnum")
    return json_data(get_patient_allergies(patient_id=patient_id))


@patient_bp.route("/getpatientconditions", methods=["GET"])
def get_patient_conditions_route():
    patient_id = request.args.get("idnum")
    return json_data(get_patient_conditions(patient_id=patient_id))


@patient_bp.route("/addnewallergy", methods=["POST"])
def add_new_allergy():
    data = request.get_json()
    return json_success(add_allergy(**data))


@patient_bp.route("/addnewcondition", methods=["POST"])
def add_new_condition():
    data = request.get_json()
    return json_success(add_condition(**data))


@patient_bp.route("/addpatient", methods=["POST"])
def add_patient_route():
    data = dict(request.get_json() or {})
    data.pop("Id", None)
    allergies = data.pop("allergies", [])
    conditions = data.pop("conditions", [])
    validation.require(data, "first_name", "middle_name", "last_name", "birthday", "sex")
    data["birthday"] = validation.iso_date(data["birthday"], "birthday")
    _check_department(data)
    # Saved in one transaction, so a failure never leaves a patient without
    # the allergies the nurse entered.
    patient_id = add_patient(allergies=allergies, conditions=conditions, **data)
    return jsonify({"success": patient_id is not None, "patient_id": patient_id})


@patient_bp.route("/addpatientallergies", methods=["POST"])
def add_patient_allergies():
    data = request.get_json()
    allergies = data["allergies"]
    patient_id = data["patient_id"]
    success = True
    for allergy in allergies:
        success = add_patient_allergy(patient_id, allergy)
    return json_success(success)


@patient_bp.route("/addpatientconditions", methods=["POST"])
def add_patient_conditions():
    data = request.get_json()
    conditions = data["conditions"]
    patient_id = data["patient_id"]
    success = True
    for condition in conditions:
        success = add_patient_condition(patient_id, condition)
    return json_success(success)


@patient_bp.route("/updatepatient", methods=["POST"])
def update_patient_route():
    # Copy, so the audit log still sees which patient the request was for.
    data = dict(request.get_json() or {})
    patient_id = data.pop("patient_id")
    if data.get("birthday"):
        data["birthday"] = validation.iso_date(data["birthday"], "birthday")
    if any(key in data for key in ("department", "level", "strand")):
        # Check the combination as it will be saved, filling in what was not sent.
        current = (get_patient("patients", patient_id=patient_id) or [{}])[0]
        merged = {key: data.get(key, current.get(key)) for key in ("department", "level", "strand")}
        _check_department(merged)
        if "strand" in data:
            data["strand"] = merged["strand"]  # "" becomes NULL
    return json_success(update_patient(patient_id, **data))


def _check_department(data):
    """Department, level and strand must fit together (see school.py). All three may be
    blank, for staff and visitors; the form requires them for students."""
    if not data.get("department") and data.get("level") in (None, "") and not data.get("strand"):
        data["strand"] = None
        return
    problem = level_problem(data.get("department"), data.get("level"), data.get("strand") or None)
    if problem:
        raise validation.ValidationError(problem)
    if not data.get("strand"):
        data["strand"] = None


@patient_bp.route("/deletepatientallergies", methods=["POST"])
def delete_patient_allergies():
    data = request.get_json()
    patient_id = data["patient_id"]
    allergies = data["allergies"]
    success = True
    for item in allergies:
        success = delete_patient_allergy(patient_id, item)
    return json_success(success)


@patient_bp.route("/addallergies", methods=["POST"])
def add_allergies():
    data = request.get_json()
    patient_id = data["patient_id"]
    allergies = data["allergies"]
    success = True
    for item in allergies:
        success = add_patient_allergy(patient_id, item)
    return json_success(success)


@patient_bp.route("/deletepatientconditions", methods=["POST"])
def delete_patient_conditions():
    data = request.get_json()
    patient_id = data["patient_id"]
    conditions = data["conditions"]
    success = True
    for item in conditions:
        success = delete_patient_condition(patient_id, item)
    return json_success(success)


@patient_bp.route("/addconditions", methods=["POST"])
def add_conditions():
    data = request.get_json()
    patient_id = data["patient_id"]
    conditions = data["conditions"]
    success = True
    for item in conditions:
        add_patient_condition(patient_id, item)
    return json_success(success)
