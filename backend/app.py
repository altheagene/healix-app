from flask import Flask, jsonify, redirect, url_for, request, Response
from flask_cors import CORS
from db.dbhelper import *
import os
import io
import csv

from controllers.appointment_controller import appointment_bp
from controllers.inventory_controller import inventory_bp
from controllers.patient_controller import patient_bp
from controllers.staff_controller import staff_bp
from controllers.visit_controller import visit_bp
from models.visit_model import get_clinic_visits


app = Flask(__name__)
# CORS(app, resources={r"/*" : {"origins":"*"}} )
CORS(app)
app.register_blueprint(appointment_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(patient_bp)
app.register_blueprint(staff_bp)
app.register_blueprint(visit_bp)

@app.route('/getall', methods=['GET'])
def get_all():
    table = request.args.get('table')
    data = getall(table)
    print(data)

    return jsonify(data)

@app.route('/getallservices', methods=['GET'])
def get_all_services():
    data = getall('services')
    return jsonify(data)

@app.route('/addservice', methods=['POST'])
def add_service():
    data = request.get_json()
    success = addrecord('services', **data)

    return jsonify({'success' : success})

@app.route('/generateclinicreport', methods=['GET'])
def generate_clinic_visit_report():
    from_date = request.args.get("fromdate")
    to_date = request.args.get("todate")
    visits = get_clinic_visits(from_date=from_date, to_date=to_date)

    headers = [
        'Visit ID',
        'Visit Datetime',
        'Notes',
        'Service ID',
        'Service Name',
        'Patient ID',
        'Patient Name',
        'Staff ID',
        'Staff Name'
    ]

    # Return CSV as response (so browser can download it)
    def generate():
        yield ','.join(headers) + '\n'
        for visit in visits:
            row = [
                str(visit['visit_id']),
                str(visit['visit_datetime']),
                visit['notes'] or '',
                str(visit['service_id']),
                visit['service_name'] or '',
                str(visit['patient_id']),
                visit['patient_name'] or '',
                str(visit['staff_id']),
                visit['staff_name'] or ''
            ]
            yield ','.join(row) + '\n'

    return Response(generate(), mimetype='text/csv',
        headers={"Content-Disposition": "attachment;filename=clinic_visit_report.csv"})

if __name__=="__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))

