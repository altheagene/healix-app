"""Audit log routes: the admin-only full list, and each person's own recent activity."""

from flask import Blueprint, request

from models.audit_model import list_audit_logs, list_my_activity
from views.api_view import json_data

audit_bp = Blueprint("audit", __name__)


@audit_bp.route("/getauditlogs", methods=["GET"])
def get_audit_logs():
    return json_data(list_audit_logs(
        from_date=request.args.get("fromdate"),
        to_date=request.args.get("todate"),
        staff_id=request.args.get("staff_id"),
        action=request.args.get("action"),
        limit=request.args.get("limit", 200),
    ))


@audit_bp.route("/myactivity", methods=["GET"])
def get_my_activity():
    me = request.staff
    return json_data(list_my_activity(me["staff_id"], me.get("username"), request.args.get("limit", 10)))
