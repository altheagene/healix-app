"""Staff routes. Each function reads the request, calls the model, and returns JSON."""

from flask import Blueprint, request

from models.staff_model import (
    add_staff,
    find_staff,
    list_staff_categories,
    list_staff_with_categories,
    update_staff,
    validate_user,
)
from views.api_view import json_data, json_success

staff_bp = Blueprint("staff", __name__)


@staff_bp.route("/finduser", methods=["GET"])
def find_user():
    staff_id = request.args.get("id")
    return json_data(find_staff(staff_id))


@staff_bp.route("/findstaff", methods=["GET"])
def find_staff_route():
    staff_id = request.args.get("id")
    return json_data(find_staff(staff_id))


@staff_bp.route("/getstaffcategories", methods=["GET"])
def get_staff_categories():
    return json_data(list_staff_categories())


@staff_bp.route("/getstaffandcateg", methods=["GET"])
def get_staff_and_categories():
    return json_data(list_staff_with_categories())


@staff_bp.route("/validateuser", methods=["POST"])
def validate_user_route():
    data = request.get_json()
    return json_success(validate_user(**data))


@staff_bp.route("/addstaff", methods=["POST"])
def add_staff_route():
    data = request.get_json()
    return json_success(add_staff(**data))


@staff_bp.route("/updatestaff", methods=["POST"])
def update_staff_route():
    data = request.get_json()
    success = update_staff(
        staff_id=data["staff_id"],
        first_name=data["first_name"],
        last_name=data["last_name"],
        staff_category_id=data["staff_category_id"],
        sex=data["sex"],
        phone=data["phone"],
        email=data["email"],
        username=data["username"],
        password=data["password"],
    )
    return json_success(success)
