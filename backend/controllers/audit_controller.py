"""Audit log routes. Admin-only list for later UI. No page is served from here."""

from flask import Blueprint, request

from models.audit_model import list_audit_logs
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
