"""Staff routes. Each function reads the request, calls the model, and returns JSON."""

from flask import Blueprint, jsonify, request

from auth import create_token
from passwords import password_matches
from roles import ADMIN, is_known_role
from models.staff_model import (
    add_staff,
    find_staff,
    list_staff_categories,
    list_staff_with_categories,
    update_staff,
    find_user_by_username,
)
from views.api_view import json_data, json_error, json_success

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
    data = request.get_json() or {}
    rows = find_user_by_username(data.get("username"))
    if not rows or not password_matches(rows[0].get("password"), data.get("password")):
        return json_error("Invalid username or password", 401)

    user = dict(rows[0])
    user.pop("password", None)
    token = create_token(
        user["staff_id"],
        user["staff_category_id"],
        user["category_name"],
    )
    return jsonify({"token": token, "user": user})


@staff_bp.route("/addstaff", methods=["POST"])
def add_staff_route():
    data = request.get_json() or {}
    if not is_known_role(data.get("staff_category_id")):
        return json_error("Unknown role")
    return json_success(add_staff(**data))


@staff_bp.route("/updatestaff", methods=["POST"])
def update_staff_route():
    data = request.get_json() or {}
    caller = request.staff
    target_id = data.get("staff_id")
    if not is_known_role(data.get("staff_category_id")):
        return json_error("Unknown role")

    is_self = str(caller.get("staff_id")) == str(target_id)
    is_admin = int(caller.get("staff_category_id")) == ADMIN
    if not is_admin and not is_self:
        return json_error("You do not have permission for this", 403)
    if not is_admin and str(data.get("staff_category_id")) != str(caller.get("staff_category_id")):
        return json_error("You do not have permission to change a role", 403)

    success = update_staff(
        staff_id=data["staff_id"],
        first_name=data["first_name"],
        last_name=data["last_name"],
        staff_category_id=data["staff_category_id"],
        sex=data["sex"],
        phone=data["phone"],
        email=data["email"],
        username=data["username"],
        password=data.get("password"),
    )
    return json_success(success)
