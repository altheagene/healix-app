"""Service routes. Reads the request, calls the service model, and returns JSON."""

from flask import Blueprint, request

from models.service_model import add_service, list_services
from views.api_view import json_data, json_success

service_bp = Blueprint("services", __name__)


@service_bp.route("/getallservices", methods=["GET"])
def get_all_services():
    return json_data(list_services())


@service_bp.route("/addservice", methods=["POST"])
def add_service_route():
    return json_success(add_service(**request.get_json()))
