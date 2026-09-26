"""Patient routes. Same URLs as before, now calling the patient model."""

from flask import Blueprint, request

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
    get_max_patient_id,
    get_patient,
    get_patient_allergies,
    get_patient_conditions,
    get_student,
    update_patient,
)
from views.api_view import json_data, json_success

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


@patient_bp.route("/getpatientdetails", methods=["GET"])
def get_patient_details():
    None


@patient_bp.route("/getmaxpatientid", methods=["GET"])
def get_max_patient_id_route():
    return json_data(get_max_patient_id())


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
    data = request.get_json()
    if "Id" in data:
        del data["Id"]
    return json_success(add_patient(**data))


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
    data = request.get_json()
    patient_id = data["patient_id"]
    del data["patient_id"]
    return json_success(update_patient(patient_id, **data))


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
