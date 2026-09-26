"""Turns Python values into JSON responses. This is the view for the API."""

from flask import jsonify


def json_data(data):
    return jsonify(data)


def json_success(success):
    return jsonify({"success": success})
