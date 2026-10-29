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

EVERYONE = frozenset({STAFF, NURSE, DOCTOR, ADMIN})
CLINICIANS = frozenset({NURSE, DOCTOR, ADMIN})
ADMINS = frozenset({ADMIN})

_EVERYONE_GET = (
    "/clinic_visits", "/download/appointmentlogs", "/download/appointments",
    "/download/inventorylogs", "/findstaff", "/findstudent", "/finduser",
    "/generateclinicreport", "/getallappointments", "/getallergies", "/getallmedicine",
    "/getallpatients", "/getallservices", "/getallsupplies", "/getallsuppliescategories",
    "/getappointmentstoday", "/getapptlogs", "/getbatches", "/getconditions", "/getinvlogs",
    "/getmedicationdetails", "/getpatient", "/getpatientallergies",
    "/getpatientcliniclogs", "/getpatientconditions",
    "/getstaffandcateg", "/getstaffcategories", "/getstudent", "/getsupplydetails",
    "/getvisitlogs", "/me", "/searchpatients", "/checkin", "/patienttimeline", "/clinicnow",
    "/searchvisits", "/getvisit", "/getinventoryalerts",
)
_EVERYONE_POST = (
    "/addallergies", "/addappointment", "/addconditions",
    "/addnewallergy", "/addnewcondition", "/addpatient", "/addpatientallergies",
    "/addpatientconditions", "/addservice", "/deletepatientallergies",
    "/deletepatientconditions", "/logout", "/resetpassword",
    "/updateappointment", "/updateappointmentdetails",
    "/updatepatient", "/updatestaff",
)
# Stock is counted and given out by the nurse or doctor; Staff can see it but not change it.
_INVENTORY_POST = (
    "/addbatch", "/additem", "/deleteitem", "/disposebatch", "/editbatch", "/editstockbatch",
    "/updatebatchactive", "/updatesupply",
)

# Every API route must be listed here. A route that is missing is refused for
# every role, so a new route stays closed until someone decides who may call it.
ROUTE_ROLES = {
    **{("GET", path): EVERYONE for path in _EVERYONE_GET},
    **{("POST", path): EVERYONE for path in _EVERYONE_POST},
    **{("POST", path): CLINICIANS for path in _INVENTORY_POST},
    # Clinical writes. The Staff role can read visits, but not save them.
    ("POST", "/addvisitlog"): CLINICIANS,
    ("POST", "/addmedicationdetails"): CLINICIANS,
    ("POST", "/updatevisitlog"): CLINICIANS,
    ("POST", "/updatemedicationdetails"): CLINICIANS,
    ("POST", "/visitoutcome"): CLINICIANS,
    # Anyone at the front desk may log that a parent was called.
    ("POST", "/notifyparent"): EVERYONE,
    # Printable summaries leave the system, and archiving hides a record: clinicians only.
    ("GET", "/patientsummary"): CLINICIANS,
    ("GET", "/download/visits"): CLINICIANS,
    ("POST", "/archivepatient"): CLINICIANS,
    ("POST", "/addstaff"): ADMINS,
    ("POST", "/adminresetpassword"): ADMINS,
    ("POST", "/setstaffactive"): ADMINS,
    ("GET", "/getauditlogs"): ADMINS,
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
    if int(role_id) not in ROUTE_ROLES.get((method, path), ()):
        return "You do not have permission for this"
    return None


def unlisted_routes(url_map, open_paths):
    """Routes with no entry in ROUTE_ROLES. Every role is refused on these."""
    missing = []
    for rule in url_map.iter_rules():
        if rule.endpoint == "static" or rule.rule in open_paths:
            continue
        for method in sorted(rule.methods - {"HEAD", "OPTIONS"}):
            if (method, rule.rule) not in ROUTE_ROLES:
                missing.append(f"{method} {rule.rule}")
    return missing
