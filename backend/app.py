from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
import os

from auth import BadSignature, SignatureExpired, read_token
from roles import permission_error, role_name, unlisted_routes
from passwords import upgrade_plaintext_passwords
from controllers.appointment_controller import appointment_bp
from controllers.inventory_controller import inventory_bp
from controllers.patient_controller import patient_bp
from controllers.service_controller import service_bp
from controllers.staff_controller import staff_bp
from controllers.visit_controller import visit_bp


DEV_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("HEALIX_ALLOWED_ORIGINS", DEV_ORIGINS).split(",")
    if origin.strip()
]

app = Flask(__name__)
# Only behind a reverse proxy (Railway, nginx) may X-Forwarded-For be trusted, and
# then only the one hop the proxy adds. Otherwise any client could fake its address.
if os.environ.get("HEALIX_TRUST_PROXY") == "1":
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)
CORS(app, origins=ALLOWED_ORIGINS, allow_headers=["Content-Type", "Authorization"])
app.register_blueprint(appointment_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(patient_bp)
app.register_blueprint(service_bp)
app.register_blueprint(staff_bp)
app.register_blueprint(visit_bp)
upgrade_plaintext_passwords()

OPEN_PATHS = {"/validateuser"}
for route in unlisted_routes(app.url_map, OPEN_PATHS):
    print("WARNING: no role rule in roles.ROUTE_ROLES, so every role is refused:", route)


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

    request.staff["category_name"] = role_name(request.staff.get("staff_category_id"))
    denied = permission_error(
        request.staff.get("staff_category_id"),
        request.method,
        request.path,
    )
    if denied:
        return jsonify({"error": denied}), 403


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
