from flask import Flask, g, jsonify, request
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
import os

from auth import BadSignature, SignatureExpired, read_token
from roles import permission_error, role_name, unlisted_routes
from security_headers import add_security_headers
from errors import register_error_handlers
from maintenance import run_daily_tasks
from db.connection import enable_wal
from migrations import run_migrations
from passwords import upgrade_plaintext_passwords
from controllers.appointment_controller import appointment_bp
from controllers.audit_controller import audit_bp
from controllers.inventory_controller import inventory_bp
from controllers.patient_controller import patient_bp
from controllers.service_controller import service_bp
from controllers.staff_controller import staff_bp
from controllers.visit_controller import visit_bp
from models.staff_model import ensure_session_column, get_session_staff
from models.audit_model import (
    action_for,
    ensure_audit_table,
    resource_for,
    should_audit,
    write_audit_log,
)


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
app.after_request(add_security_headers)
register_error_handlers(app)
app.before_request(run_daily_tasks)
app.register_blueprint(appointment_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(patient_bp)
app.register_blueprint(service_bp)
app.register_blueprint(staff_bp)
app.register_blueprint(visit_bp)
app.register_blueprint(audit_bp)
enable_wal()
ensure_session_column()
run_migrations()
upgrade_plaintext_passwords()
ensure_audit_table()

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
        claims = read_token(header.removeprefix("Bearer ").strip())
    except SignatureExpired:
        return jsonify({"error": "Token expired"}), 401
    except BadSignature:
        return jsonify({"error": "Invalid token"}), 401

    staff = get_session_staff(claims.get("staff_id"))
    if not staff or staff["token_version"] != claims.get("v"):
        return jsonify({"error": "Session ended"}), 401

    request.staff = {
        "staff_id": staff["staff_id"],
        "username": staff["username"],
        "staff_category_id": staff["staff_category_id"],
        "category_name": role_name(staff["staff_category_id"]),
    }
    denied = permission_error(
        request.staff.get("staff_category_id"),
        request.method,
        request.path,
    )
    if denied:
        return jsonify({"error": denied}), 403


def _request_details():
    if request.method == "GET":
        args = request.args.to_dict(flat=True)
        return args or None
    return request.get_json(silent=True)


@app.after_request
def record_audit(response):
    try:
        if not should_audit(request.method, request.path, response.status_code):
            return response

        actor = getattr(g, "audit_actor", None) or getattr(request, "staff", None) or {}
        username = actor.get("username")
        if not username and request.path == "/validateuser":
            body = request.get_json(silent=True) or {}
            username = body.get("username")

        write_audit_log(
            staff_id=actor.get("staff_id"),
            username=username,
            role_name=actor.get("category_name") or actor.get("role_name"),
            action=action_for(request.path, request.method, response.status_code),
            resource=resource_for(request.path),
            method=request.method,
            path=request.path,
            status_code=response.status_code,
            ip_address=request.remote_addr,
            user_agent=request.headers.get("User-Agent"),
            details=_request_details(),
            success=200 <= response.status_code < 400,
        )
    except Exception as exc:
        print("AUDIT hook error:", exc)
    return response


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
