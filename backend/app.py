from flask import Flask, jsonify, request
from flask_cors import CORS
import os

from auth import BadSignature, SignatureExpired, read_token
from passwords import upgrade_plaintext_passwords
from controllers.appointment_controller import appointment_bp
from controllers.inventory_controller import inventory_bp
from controllers.patient_controller import patient_bp
from controllers.service_controller import service_bp
from controllers.staff_controller import staff_bp
from controllers.visit_controller import visit_bp


app = Flask(__name__)
CORS(app, allow_headers=["Content-Type", "Authorization"])
app.register_blueprint(appointment_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(patient_bp)
app.register_blueprint(service_bp)
app.register_blueprint(staff_bp)
app.register_blueprint(visit_bp)
upgrade_plaintext_passwords()

OPEN_PATHS = {"/validateuser"}


@app.before_request
def require_token():
    if request.method == "OPTIONS" or request.path in OPEN_PATHS:
        return None

    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return jsonify({"error": "Missing token"}), 401

    try:
        request.staff = read_token(header.removeprefix("Bearer ").strip())
    except SignatureExpired:
        return jsonify({"error": "Token expired"}), 401
    except BadSignature:
        return jsonify({"error": "Invalid token"}), 401


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
