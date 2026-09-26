from flask import Flask, jsonify, redirect, url_for, request, Response
from flask_cors import CORS
from db.dbhelper import *
from datetime import date, datetime
import os
import io
import csv

from controllers.patient_controller import patient_bp
from controllers.staff_controller import staff_bp


app = Flask(__name__)
# CORS(app, resources={r"/*" : {"origins":"*"}} )
CORS(app)
app.register_blueprint(patient_bp)
app.register_blueprint(staff_bp)

@app.route('/getall', methods=['GET'])
def get_all():
    table = request.args.get('table')
    data = getall(table)
    print(data)

    return jsonify(data)

@app.route('/getallappointments', methods=['GET'])
def get_all_appointments():
    data = getappointments()

    return jsonify(data)

@app.route('/updateappointment', methods=['POST'])
def update_appointment():
    data = request.get_json()
    success = updaterecord('appointments', **data)

    return jsonify({'success' : success})

@app.route('/getbatches', methods=['GET'])
def get_batches():
    supply_id = request.args.get('idnum')
    data = getrecord('batches', supply_id=supply_id)

    return jsonify(data)

@app.route('/getappointmentstoday', methods=['GET'])
def get_appointments_today():
    data = getallappointmentstoday()

    return jsonify(data)

# @app.route('/getallsupplies', methods=['GET'])
# def get_all_supplies():
#     data = getall('supplies')
#     return jsonify(data)

@app.route('/getsupplydetails', methods=['GET'])
def get_supply_details():
    supply_id = request.args.get('idnum')
    supply_info = getitemdetails('supplies', supply_id=supply_id)

    return jsonify(supply_info)

@app.route('/getallservices', methods=['GET'])
def get_all_services():
    data = getall('services')
    return jsonify(data)

@app.route('/getallsuppliescategories', methods=['GET'])
def get_all_supplies_categorie():
    data = getall('supplies_categories')
    return jsonify(data)

@app.route('/getallmedicine', methods=['GET'])
def get_all_medicine():
    data = getallmedicine()
    return jsonify(data)

@app.route("/clinic_visits", methods=['GET'])
def get_clinic_visits():
    args = {
        "from_date": request.args.get("fromdate"),
        "to_date": request.args.get("todate")
    }

    print(args['from_date'])
    data = getclinicvisits(**args)
    return jsonify(data)

@app.route('/getinvlogs', methods=['GET'])
def get_inv_logs():
    args = {
        "from_date": request.args.get("fromdate"),
        "to_date": request.args.get("todate")
    }

    data = getinventorylogs(**args)
    return jsonify(data)

@app.route('/getapptlogs')
def get_appt_logs():
    args = {
        "from_date": request.args.get("fromdate"),
        "to_date": request.args.get("todate")
    }

    data = getappointmentlogs(**args)
    return jsonify(data)

@app.route('/getpatientcliniclogs', methods=['GET'])
def get_patient_clinic_logs():
    args = request.args.get('idnum')
    data = getpatientcliniclogs(patient_id=args)
    return jsonify(data)

@app.route('/getallsupplies', methods=['GET'])
def get_all_supplies():
    data = getallsupplies()
    return jsonify(data)

@app.route('/getmedicationdetails')
def get_medication_details():
    idnum = request.args.get('idnum')
    data = getmedicationdetails(visit_id = idnum)
    
    return jsonify(data)

@app.route('/getvisitlogs', methods=['GET'])
def get_visitlogs():
    data = get_visit_logs()
    return jsonify(data)

# ----------------------INSERT QUERIES----------------------------

@app.route('/addvisitlog', methods=['POST'])
def add_visitlog():
    data = request.get_json()
    success = addrecord('visit_logs', **data)

    return jsonify({'success' : success})

@app.route('/addservice', methods=['POST'])
def add_service():
    data = request.get_json()
    success = addrecord('services', **data)

    return jsonify({'success' : success})

@app.route('/additem', methods=['POST'])
def add_item():
    data = request.get_json()
    success = addrecord('supplies', **data)
    
    return jsonify({'success' : success})

@app.route('/addbatch', methods=['POST'])
def add_batch():
    data = request.get_json()
    success = addrecord('batches', **data)

    if success == False:
        return jsonify({'success' : success})
    #get the latest and max batch id
    max_batch_id = getmaxid('batches', 'batch_id')
    batch_id = max_batch_id[0]['last_id']
    # batch_id = 30
    item_in = data['stock_level']
    item_out = 0
    inv_date = date.today()

    success = addrecord('inventory', batch_id=batch_id, item_in=item_in, item_out=item_out, inv_date = inv_date)
    print
    return jsonify({'success' : success})
    
@app.route('/editstockbatch', methods=['POST'])
def edit_stock_batch():
    data = request.get_json()
    print(data)
    batch_id = data['batch_id']
    inv_date = date.today()
    item_in = data['item_in']
    item_out = data['item_out']
    update_value = item_in - item_out
    success = addrecord('inventory', batch_id=batch_id, inv_date=inv_date, item_in=item_in, item_out=item_out)
    updatestock('batches', update_value=update_value,  batch_id=batch_id)

    return jsonify({'success' : success})

@app.route('/editbatch', methods=['POST'])
def edit_batch():
    data = request.get_json()
    success = updaterecord('batches', **data)
    
    return jsonify({'success' : success})

@app.route('/addmedicationdetails', methods=['POST'])
def add_med_details():
    data = request.get_json()
    print(data)
    latest_visit_id = getmaxid('visit_logs', 'visit_id')
    for med in data:
        supply_id = med['supply_id']
        quantity = med['quantity']
        latest_visit = latest_visit_id[0]['last_id']
        print(supply_id)
        print(med)
        print(latest_visit_id)
        addrecord('medication_details', visit_id=latest_visit, supply_id=supply_id, quantity=quantity)
        if med['auto_deduct'] == 1:
            deductbatch(supply_id, quantity)
        
    
    return jsonify({'success' : True})

@app.route('/addappointment', methods=['POST'])
def add_appointment():
    data = request.get_json()
    success = addrecord('appointments', **data)

    return jsonify({'success' : success})

@app.route('/updateappointmentdetails', methods=['POST'])
def update_appointmen_details():
    data = request.get_json()
    appointment_id = data['appointment_id']
    del data['appointment_id']
    del data['patient_name']
    del data['service_name']
    print(data)
    success = updateappointment(appointment_id, **data)
    return jsonify({'success' : success})


# -----------------------------------DELETE----------------------------

@app.route('/updatebatchactive', methods=['POST'])
def update_batch_active():
    data = request.get_json()
    success = updaterecord('batches', **data)

    return jsonify({'success' : success})

@app.route('/deleteitem', methods=['POST'])
def delete_item():
    data = request.get_json()
    
    success = updaterecord('supplies', **data)

    return jsonify({'success' : success})

@app.route('/updatesupply', methods=['POST'])
def update_supply():
    data = request.get_json()
    success = updaterecord('supplies', **data)

    return jsonify({'success' : success})

@app.route('/refreshbatches', methods=['GET'])
def refresh_batches():
    try:
        batches = getall('batches')
        datenow = date.today()
        success = True

        for batch in batches:
            print(batch['expiration_date'])
            if batch['expiration_date'] != '':
                exp = batch['expiration_date']

                # convert "YYYY-MM-DD" → date object
                if isinstance(exp, str):
                    exp = datetime.strptime(exp, "%Y-%m-%d").date()

                if exp < datenow:
                    updaterecord('batches', batch_id=batch['batch_id'], is_active=False)
    except Exception as e:
        print(e)
    
    return jsonify({'success': success})


@app.route('/generateclinicreport', methods=['GET'])
def generate_clinic_visit_report():
    from_date = request.args.get("fromdate")
    to_date = request.args.get("todate")
    visits = getclinicvisits(from_date=from_date, to_date=to_date)

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



@app.route('/download/appointments', methods=['GET'])
def download_appointments():
    # Get the appointment data
    appointments = getappointments()

    # Create a CSV in memory
    def generate():
        # CSV header
        header = ['Appointment ID', 'Date', 'Start Time', 'Status', 'Notes', 'Service ID', 'Service Name', 'Patient ID', 'Patient Name']
        yield ','.join(header) + '\n'

        # CSV rows
        for appt in appointments:
            row = [
                str(appt['appointment_id']),
                str(appt['appointment_date']),
                str(appt['start_time']),
                appt['status'] or '',
                appt['Notes'] or '',
                str(appt['service_id']),
                appt['service_name'] or '',
                str(appt['patient_id']),
                appt['patient_name'] or ''
            ]
            # Escape commas in text
            row = [f'"{col}"' if ',' in col else col for col in row]
            yield ','.join(row) + '\n'

    # Return as a downloadable CSV
    return Response(generate(), mimetype='text/csv',
        headers={"Content-Disposition": "attachment;filename=appointments_report.csv"})


@app.route('/download/appointmentlogs', methods=['GET'])
def download_appointment_logs():
    # Get query parameters
    from_date = request.args.get("fromdate")
    to_date = request.args.get("todate")

    # Fetch data from DB
    logs = getappointmentlogs(from_date=from_date, to_date=to_date)

    # CSV headers
    headers = [
        'Appointment ID',
        'Service ID',
        'Service Name',
        'Appointment Date',
        'Start Time',
        'Status',
        'Patient ID',
        'Patient Name'
    ]

    # Generator to stream CSV rows
    def generate():
        yield ','.join(headers) + '\n'
        for log in logs:
            row = [
                str(log['appointment_id']),
                str(log['service_id']),
                log['service_name'] or '',
                str(log['appointment_date']),
                str(log['start_time']),
                log['status'] or '',
                str(log['patient_id']),
                log['patient_name'] or ''
            ]
            # Quote fields that contain commas
            row = [f'"{col}"' if ',' in col else col for col in row]
            yield ','.join(row) + '\n'

    # Return as downloadable CSV
    return Response(generate(), mimetype='text/csv',
        headers={"Content-Disposition": "attachment;filename=appointment_logs.csv"})



@app.route('/download/inventorylogs', methods=['GET'])
def download_inventory_logs():
    # Get query parameters
    from_date = request.args.get("fromdate")
    to_date = request.args.get("todate")

    # Fetch inventory log data
    logs = getinventorylogs(from_date=from_date, to_date=to_date)

    # CSV headers
    headers = [
        'Inventory ID',
        'Inventory Date',
        'Batch ID',
        'Batch Number',
        'Expiration Date',
        'Supply ID',
        'Supply Name',
        'Item In',
        'Item Out',
        'Auto Update'
    ]

    # Generator to stream CSV rows
    def generate():
        yield ','.join(headers) + '\n'
        for log in logs:
            row = [
                str(log['inv_id']),
                str(log['inv_date']),
                str(log['batch_id']),
                log['batch_number'] or '',
                str(log['expiration_date']),
                str(log['supply_id']),
                log['supply_name'] or '',
                str(log['item_in']),
                str(log['item_out']),
                str(log['auto_update'])
            ]
            # Quote any fields containing commas
            row = [f'"{col}"' if ',' in col else col for col in row]
            yield ','.join(row) + '\n'

    # Return as downloadable CSV
    return Response(generate(), mimetype='text/csv',
                    headers={"Content-Disposition": "attachment;filename=inventory_logs.csv"})

@app.route("/updatevisitlog", methods=["POST"])
def update_visit_log():
    data = request.get_json()
    visit_id = data.get("visit_id")
    weight = data.get("weight")
    temperature = data.get("temperature")
    service_id = data.get("service_id")
    staff_id = data.get("staff_id")
    notes = data.get("notes")

    success = updaterecord('visit_logs', visit_id=visit_id, weight=weight, temperature=temperature, service_id=service_id, staff_id=staff_id, notes=notes)

    return jsonify({"success": True})

@app.route("/updatemedicationdetails", methods=["POST"])
def update_medication_details():
    data = request.get_json()
    visit_id = data.get("visit_id")
    medications = data.get("medications", [])

    if not visit_id:
        return jsonify({"error": "visit_id is required"}), 400

    # Delete existing medications for this visit
    success = deleterecord('medication_details', visit_id=visit_id)

    # Insert updated medications
    for med in medications:
        supply_id = med.get("supply_id")
        quantity = med.get("quantity", 0)
        auto_deduct = 1 if med.get("auto_deduct") else 0

        success = addrecord('medication_details', visit_id=visit_id, supply_id=supply_id, quantity=quantity)

    
    return jsonify({"success": True})

if __name__=="__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))

