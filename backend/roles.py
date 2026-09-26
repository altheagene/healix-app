"""Staff roles. These ids match the staff_category_id values already stored on staff rows."""

STAFF = 1
NURSE = 2
DOCTOR = 3
ADMIN = 4

ROLES = (
    {"staff_category_id": STAFF, "category_name": "Staff"},
    {"staff_category_id": NURSE, "category_name": "Nurse"},
    {"staff_category_id": DOCTOR, "category_name": "Doctor"},
    {"staff_category_id": ADMIN, "category_name": "Admin"},
)

# Clinical writes. The Staff role can read visits, but not save them.
STAFF_BLOCKED = {
    ("POST", "/addvisitlog"),
    ("POST", "/addmedicationdetails"),
    ("POST", "/updatevisitlog"),
    ("POST", "/updatemedicationdetails"),
}

ADMIN_ONLY = {
    ("POST", "/addstaff"),
}


def role_name(role_id):
    try:
        role_id = int(role_id)
    except (TypeError, ValueError):
        return None
    for role in ROLES:
        if role["staff_category_id"] == role_id:
            return role["category_name"]
    return None


def is_known_role(role_id):
    return role_name(role_id) is not None


def permission_error(role_id, method, path):
    """Return an error message when this role cannot call the route."""
    if role_name(role_id) is None:
        return "Unknown role"
    if (method, path) in ADMIN_ONLY and int(role_id) != ADMIN:
        return "You do not have permission for this"
    if int(role_id) == STAFF and (method, path) in STAFF_BLOCKED:
        return "You do not have permission for this"
    return None
