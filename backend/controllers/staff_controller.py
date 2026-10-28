"""Staff routes. Each function reads the request, calls the model, and returns JSON."""

from flask import Blueprint, g, jsonify, request

from auth import create_token
from login_throttle import clear_account, record_failure, retry_after
from passwords import password_matches, password_problem
from roles import ADMIN, is_known_role
from models.staff_model import (
    add_staff,
    find_staff,
    list_staff_categories,
    list_staff_with_categories,
    update_staff,
    find_user_by_username,
    get_staff_password,
    update_staff_password,
    end_sessions,
    get_session_staff,
)
from views.api_view import json_data, json_error, json_success
import validation

staff_bp = Blueprint("staff", __name__)


# Only admins, and each person for themselves, may see these.
PRIVATE_STAFF_FIELDS = ("email", "phone", "birthday")


def _hide_private_fields(rows):
    caller = request.staff
    if int(caller["staff_category_id"]) == ADMIN:
        return rows
    for row in rows:
        if str(row.get("staff_id")) != str(caller["staff_id"]):
            for field in PRIVATE_STAFF_FIELDS:
                row.pop(field, None)
    return rows


@staff_bp.route("/finduser", methods=["GET"])
def find_user():
    staff_id = request.args.get("id")
    return json_data(_hide_private_fields(find_staff(staff_id)))


@staff_bp.route("/findstaff", methods=["GET"])
def find_staff_route():
    staff_id = request.args.get("id")
    return json_data(_hide_private_fields(find_staff(staff_id)))


@staff_bp.route("/getstaffcategories", methods=["GET"])
def get_staff_categories():
    return json_data(list_staff_categories())


@staff_bp.route("/getstaffandcateg", methods=["GET"])
def get_staff_and_categories():
    return json_data(_hide_private_fields(list_staff_with_categories()))


@staff_bp.route("/validateuser", methods=["POST"])
def validate_user_route():
    data = request.get_json() or {}
    username = data.get("username")
    wait = retry_after(username, request.remote_addr)
    if wait:
        response, status = json_error("Too many failed logins. Try again later.", 429)
        response.headers["Retry-After"] = str(wait)
        return response, status

    rows = find_user_by_username(username)
    if not rows or not password_matches(rows[0].get("password"), data.get("password")):
        record_failure(username, request.remote_addr)
        return json_error("Invalid username or password", 401)
    clear_account(username, request.remote_addr)

    user = dict(rows[0])
    user.pop("password", None)
    token_version = user.pop("token_version", 0)
    g.audit_actor = {
        "staff_id": user["staff_id"],
        "username": user.get("username"),
        "category_name": user.get("category_name"),
    }
    token = create_token(user["staff_id"], token_version)
    return jsonify({"token": token, "user": user})


@staff_bp.route("/me", methods=["GET"])
def me_route():
    """Who the token belongs to and their role right now, so the UI never shows a stale role."""
    return jsonify({key: request.staff[key] for key in ("staff_id", "username", "staff_category_id", "category_name")})


@staff_bp.route("/logout", methods=["POST"])
def logout_route():
    # Ends every session this staff member has open, on all devices.
    return json_success(end_sessions(request.staff["staff_id"]))


@staff_bp.route("/addstaff", methods=["POST"])
def add_staff_route():
    data = request.get_json() or {}
    validation.require(data, "first_name", "last_name", "staff_category_id", "username", "password")
    if not is_known_role(data.get("staff_category_id")):
        return json_error("Unknown role")
    problem = password_problem(data.get("password"), data.get("username"))
    if problem:
        return json_error(problem)
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
    )
    return json_success(success)


@staff_bp.route("/resetpassword", methods=["POST"])
def reset_password_route():
    data = request.get_json() or {}
    caller = request.staff
    staff_id = caller.get("staff_id")
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return json_error("Current password and new password are required")
    problem = password_problem(new_password, caller.get("username"))
    if problem:
        return json_error(problem)

    stored = get_staff_password(staff_id)
    if not password_matches(stored, current_password):
        return json_error("Current password is incorrect", 400)

    if not update_staff_password(staff_id, new_password):
        return json_success(False)

    # Sign out other devices that may know the old password, and keep this one signed in.
    end_sessions(staff_id)
    token = create_token(staff_id, get_session_staff(staff_id)["token_version"])
    return jsonify({"success": True, "token": token})


@staff_bp.route("/adminresetpassword", methods=["POST"])
def admin_reset_password_route():
    """An admin sets a new password for someone who forgot theirs, and signs them out everywhere."""
    data = request.get_json() or {}
    target = get_session_staff(data.get("staff_id"))
    if not target:
        return json_error("No such staff member", 404)

    new_password = data.get("new_password")
    problem = password_problem(new_password, target["username"])
    if problem:
        return json_error(problem)

    if not update_staff_password(target["staff_id"], new_password):
        return json_success(False)
    end_sessions(target["staff_id"])
    return json_success(True)
