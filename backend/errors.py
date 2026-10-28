"""Turns exceptions into JSON error responses, so the browser always gets a reason."""

import sqlite3
import traceback

from flask import jsonify
from werkzeug.exceptions import HTTPException

from validation import ValidationError


def register_error_handlers(app):
    @app.errorhandler(ValidationError)
    def bad_input(error):
        return jsonify({"error": str(error)}), 400

    @app.errorhandler(KeyError)
    def missing_field(error):
        return jsonify({"error": f"Missing required field: {error.args[0]}"}), 400

    @app.errorhandler(sqlite3.Error)
    def database_unavailable(error):
        traceback.print_exc()
        return jsonify({"error": "The database is unavailable right now. Please try again."}), 503

    @app.errorhandler(Exception)
    def unexpected(error):
        if isinstance(error, HTTPException):
            return jsonify({"error": error.description}), error.code
        traceback.print_exc()
        return jsonify({"error": "Something went wrong on the server."}), 500
