"""Inventory routes. Reads the request, calls the inventory model, and returns JSON or CSV."""

from flask import Blueprint, request

from models.inventory_model import (
    DISPOSE_REASONS,
    STOCK_IN_REASONS,
    STOCK_OUT_REASONS,
    add_batch,
    add_supply,
    dispose_batch,
    inventory_alerts,
    list_batches,
    list_inventory_logs,
    list_medicine,
    list_supplies,
    list_supply_categories,
    move_stock,
    supply_details,
    update_batch,
    update_supply,
)
from views.api_view import json_data, json_success
import validation
from views.report_view import inventory_logs_csv

inventory_bp = Blueprint("inventory", __name__)

# What the item forms may set. Stock is never set directly: it only changes through
# batches and logged movements.
SUPPLY_FIELDS = ("supply_name", "brand", "category_id", "description", "auto_deduct", "is_active", "unit",
                 "reorder_level")


def _supply_fields(data):
    fields = {key: data[key] for key in SUPPLY_FIELDS if key in data}
    if "unit" in fields:
        fields["unit"] = (fields["unit"] or "").strip() or None
    if "reorder_level" in fields:
        level = fields["reorder_level"]
        fields["reorder_level"] = None if level in (None, "") else validation.non_negative_int(level, "reorder_level")
    return fields


def _note(data):
    return (data.get("note") or "").strip()[:300] or None


def _staff_id():
    return request.staff["staff_id"]


def _log_dates(args):
    return (
        validation.iso_date(args.get("fromdate"), "fromdate"),
        validation.iso_date(args.get("todate"), "todate"),
    )


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
    return json_data(list_inventory_logs(*_log_dates(request.args)))


@inventory_bp.route("/getallsupplies", methods=["GET"])
def get_all_supplies():
    return json_data(list_supplies())


@inventory_bp.route("/getinventoryalerts", methods=["GET"])
def get_inventory_alerts():
    days = validation.non_negative_int(request.args.get("days") or 60, "days")
    return json_data(inventory_alerts(min(days, 365)))


@inventory_bp.route("/additem", methods=["POST"])
def add_item():
    fields = _supply_fields(request.get_json() or {})
    validation.require(fields, "supply_name", "category_id")
    return json_success(add_supply(**fields))


@inventory_bp.route("/addbatch", methods=["POST"])
def add_batch_route():
    data = dict(request.get_json() or {})
    validation.require(data, "supply_id", "batch_number", "stock_level")
    reason = data.get("reason") or "restock"
    if reason not in ("restock", "donation"):
        raise validation.ValidationError("reason must be restock or donation")
    fields = {key: data[key] for key in ("supply_id", "batch_number", "expiration_date", "is_active") if key in data}
    fields["stock_level"] = validation.non_negative_int(data["stock_level"], "stock_level")
    if fields.get("expiration_date"):
        fields["expiration_date"] = validation.iso_date(fields["expiration_date"], "expiration_date")
    return json_success(add_batch(reason=reason, staff_id=_staff_id(), note=_note(data), **fields))


@inventory_bp.route("/editstockbatch", methods=["POST"])
def edit_stock_batch_route():
    data = request.get_json() or {}
    validation.require(data, "batch_id", "reason")
    item_in = validation.non_negative_int(data.get("item_in") or 0, "item_in")
    item_out = validation.non_negative_int(data.get("item_out") or 0, "item_out")
    reason = data["reason"]
    if item_in and item_out:
        allowed = ("correction",)
    else:
        allowed = STOCK_IN_REASONS if item_in else STOCK_OUT_REASONS
    if reason not in allowed:
        raise validation.ValidationError(f"reason must be one of: {', '.join(allowed)}")
    return json_success(move_stock(data["batch_id"], item_in, item_out, reason, _staff_id(), _note(data)))


@inventory_bp.route("/disposebatch", methods=["POST"])
def dispose_batch_route():
    data = request.get_json() or {}
    validation.require(data, "batch_id", "reason")
    if data["reason"] not in DISPOSE_REASONS:
        raise validation.ValidationError(f"reason must be one of: {', '.join(DISPOSE_REASONS)}")
    return json_success(dispose_batch(data["batch_id"], data["reason"], _staff_id(), _note(data)))


@inventory_bp.route("/editbatch", methods=["POST"])
def edit_batch():
    data = request.get_json() or {}
    validation.require(data, "batch_id")
    fields = {key: data[key] for key in ("batch_number", "expiration_date") if key in data}
    if fields.get("expiration_date"):
        fields["expiration_date"] = validation.iso_date(fields["expiration_date"], "expiration_date")
    return json_success(update_batch(batch_id=data["batch_id"], **fields))


@inventory_bp.route("/updatebatchactive", methods=["POST"])
def update_batch_active():
    data = request.get_json() or {}
    validation.require(data, "batch_id", "is_active")
    return json_success(update_batch(batch_id=data["batch_id"], is_active=bool(data["is_active"])))


@inventory_bp.route("/deleteitem", methods=["POST"])
def delete_item():
    data = request.get_json() or {}
    validation.require(data, "supply_id", "is_active")
    return json_success(update_supply(supply_id=data["supply_id"], is_active=bool(data["is_active"])))


@inventory_bp.route("/updatesupply", methods=["POST"])
def update_supply_route():
    data = request.get_json() or {}
    validation.require(data, "supply_id")
    return json_success(update_supply(supply_id=data["supply_id"], **_supply_fields(data)))


@inventory_bp.route("/download/inventorylogs", methods=["GET"])
def download_inventory_logs():
    return inventory_logs_csv(list_inventory_logs(*_log_dates(request.args)))
