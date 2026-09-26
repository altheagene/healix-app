"""Inventory routes. Reads the request, calls the inventory model, and returns JSON or CSV."""

from flask import Blueprint, request

from models.inventory_model import (
    add_batch,
    add_supply,
    edit_stock_batch,
    list_batches,
    list_inventory_logs,
    list_medicine,
    list_supplies,
    list_supply_categories,
    refresh_expired_batches,
    supply_details,
    update_batch,
    update_supply,
)
from views.api_view import json_data, json_success
from views.report_view import inventory_logs_csv

inventory_bp = Blueprint("inventory", __name__)


@inventory_bp.route("/getbatches", methods=["GET"])
def get_batches():
    supply_id = request.args.get("idnum")
    return json_data(list_batches(supply_id))


@inventory_bp.route("/getsupplydetails", methods=["GET"])
def get_supply_details():
    supply_id = request.args.get("idnum")
    return json_data(supply_details(supply_id))


@inventory_bp.route("/getallsuppliescategories", methods=["GET"])
def get_supply_categories():
    return json_data(list_supply_categories())


@inventory_bp.route("/getallmedicine", methods=["GET"])
def get_all_medicine():
    return json_data(list_medicine())


@inventory_bp.route("/getinvlogs", methods=["GET"])
def get_inventory_logs():
    return json_data(list_inventory_logs(
        from_date=request.args.get("fromdate"),
        to_date=request.args.get("todate"),
    ))


@inventory_bp.route("/getallsupplies", methods=["GET"])
def get_all_supplies():
    return json_data(list_supplies())


@inventory_bp.route("/additem", methods=["POST"])
def add_item():
    return json_success(add_supply(**request.get_json()))


@inventory_bp.route("/addbatch", methods=["POST"])
def add_batch_route():
    return json_success(add_batch(**request.get_json()))


@inventory_bp.route("/editstockbatch", methods=["POST"])
def edit_stock_batch_route():
    data = request.get_json()
    return json_success(edit_stock_batch(
        data["batch_id"],
        data["item_in"],
        data["item_out"],
    ))


@inventory_bp.route("/editbatch", methods=["POST"])
def edit_batch():
    return json_success(update_batch(**request.get_json()))


@inventory_bp.route("/updatebatchactive", methods=["POST"])
def update_batch_active():
    return json_success(update_batch(**request.get_json()))


@inventory_bp.route("/deleteitem", methods=["POST"])
def delete_item():
    return json_success(update_supply(**request.get_json()))


@inventory_bp.route("/updatesupply", methods=["POST"])
def update_supply_route():
    return json_success(update_supply(**request.get_json()))


@inventory_bp.route("/refreshbatches", methods=["GET"])
def refresh_batches():
    return json_success(refresh_expired_batches())


@inventory_bp.route("/download/inventorylogs", methods=["GET"])
def download_inventory_logs():
    logs = list_inventory_logs(
        from_date=request.args.get("fromdate"),
        to_date=request.args.get("todate"),
    )
    return inventory_logs_csv(logs)
