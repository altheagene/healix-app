from flask import Flask
from flask_cors import CORS
import os

from controllers.appointment_controller import appointment_bp
from controllers.inventory_controller import inventory_bp
from controllers.patient_controller import patient_bp
from controllers.service_controller import service_bp
from controllers.staff_controller import staff_bp
from controllers.visit_controller import visit_bp


app = Flask(__name__)
CORS(app)
app.register_blueprint(appointment_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(patient_bp)
app.register_blueprint(service_bp)
app.register_blueprint(staff_bp)
app.register_blueprint(visit_bp)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
