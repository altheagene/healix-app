from flask import Flask, jsonify, redirect, url_for, request
from flask_cors import CORS
import sys
sys.path.insert(0, '/db')
from db.dbhelper import *
from datetime import date 
import os

app = Flask(__name__)
# CORS(app, resources={r"/*" : {"origins":"*"}} )
CORS(app)


@app.route('/findstudent', methods=['GET'])
def find_student():
    idnum = request.args.get('idnum')
    data = findstudent('students', student_id=idnum)
    return jsonify(data)

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
    data = getrecord('batch', supply_id=supply_id)

    return jsonify(data)

@app.route('/getstudent', methods=['GET'])
def get_student():
    idnum = request.args.get('idnum')
    data = getstudent(student_id=idnum)

    return jsonify(data)

@app.route('/getallergies', methods=['GET'])
def get_allergies():
    data = getallergies('allergies')
    return jsonify(data)

@app.route('/getconditions', methods=['GET'])
def get_conditions():
    data = getconditions('conditions')
    return jsonify(data)

@app.route('/getallpatients', methods=['GET'])
def get_all_patients():
    data  = getall('patients')
    return jsonify(data)

@app.route('/getappointmentstoday', methods=['GET'])
def get_appointments_today():
    data = getallappointmentstoday()

    return jsonify(data)

@app.route('/getpatientdetails', methods=['GET'])
def get_patient_details():
    None

@app.route('/getmaxpatientid', methods=['GET'])
def get_max_patient_id():
    data = getmaxid('patients', 'patient_id')
    return jsonify(data)

@app.route('/getpatient', methods=['GET'])
def get_patient():
    patient_id = request.args.get('idnum')
    data = getpatient('patients', patient_id=patient_id)

    return jsonify(data)

@app.route('/getpatientallergies', methods=['GET'])
def get_patient_allergies():
    patient_id = request.args.get('idnum')
    # data = getallwithcondition('patient_allergies', patient_id=patient_id)
    data = getallpatientallergies(patient_id = patient_id)

    return jsonify(data)

@app.route('/getpatientconditions', methods=['GET'])
def get_patient_conditions():
    patient_id = request.args.get('idnum')
    data = getpatientconditions(patient_id=patient_id)

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

@app.route('/validateuser', methods=['POST'])
def validate_user():
    data = request.get_json()
    success = validateuser(**data)
    print(success)
    return ({'success' : success})

@app.route('/findstaff', methods =['GET'])
def find_staff():
    id = request.args.get('id')
    print(id)
    staff = getrecord('staff', staff_id=id)

    return jsonify(staff)

# ----------------------INSERT QUERIES----------------------------

@app.route('/addnewallergy', methods=['POST'])
def add_new_allergy():
    data = request.get_json()
    success = addrecord('allergies', **data)

    return jsonify({'success' : success})

@app.route('/addnewcondition', methods=['POST'])
def add_new_conditions():
    data = request.get_json()
    success = addrecord('conditions', **data)

    return jsonify({'success' : success})

@app.route('/addvisitlog', methods=['POST'])
def add_visitlog():
    data = request.get_json()
    success = addrecord('visit_logs', **data)

    return jsonify({'success' : success})

@app.route('/addpatient', methods=['POST'])
def add_patient():
    data = request.get_json()
    del data['Id']
    success = addrecord('patients', **data)

    return jsonify({'success' : success})


@app.route('/addpatientallergies', methods=['POST'])
def add_patient_allergies():
    data = request.get_json()
    allergies = data['allergies']
    id = data['patient_id']
    # allergies = data['allergies']
    success = True
    for allergy in allergies:
        ok = addrecord('patient_allergies', patient_id = id, allergy_id = allergy)
        success = ok

    return jsonify({'success' : success})

@app.route('/addstaff', methods=['POST'])
def add_staff():
    data = request.get_json()
    success = addrecord('staff', **data)

    return jsonify({'success' : success})

@app.route('/addpatientconditions', methods=['POST'])
def add_patient_conditions():
    data = request.get_json()
    conditions = data['conditions']
    id = data['patient_id']
    # allergies = data['allergies']
    success = True
    for condition in conditions:
        ok = addrecord('patient_conditions', patient_id = id, condition_id =  condition)
        success = ok

    return jsonify({'success' : success})
    
@app.route('/additem', methods=['POST'])
def add_item():
    data = request.get_json()
    success = addrecord('supplies', **data)
    
    return jsonify({'success' : success})

@app.route('/addbatch', methods=['POST'])
def add_batch():
    data = request.get_json()
    success = addrecord('batch', **data)

    #get the latest and max batch id
    max_batch_id = getmaxid('batch', 'batch_id')
    batch_id = max_batch_id[0]['last_id']
    # batch_id = 30
    item_in = data['stock_level']
    item_out = 0
    inv_date = date.today()

    success = addrecord('inventory', batch_id=batch_id, item_in=item_in, item_out=item_out, inv_date = inv_date)

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
    updatestock('batch', update_value=update_value,  batch_id=batch_id)

    return jsonify({'success' : success})

@app.route('/editbatch', methods=['POST'])
def edit_batch():
    data = request.get_json()
    success = updaterecord('batch', **data)
    
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

@app.route('/updatestaff', methods=['POST'])
def update_staff():
    data = request.get_json()
    # staff_kwargs = {
    #     'staff_id': data['staff_id'],
    #     'first_name': data['first_name'],
    #     'last_name': data['last_name'],
    #     'staff_category_id': data['staff_category_id'],
    #     'sex': data['sex'],
    #     'phone': data['phone'],
    #     'email': data['email'],
    #     'username': data['username'],
    #     'password': data['password']
    # }

    # Suppose `data` is a dictionary from your database query
    staff_id = data['staff_id']
    first_name = data['first_name']
    last_name = data['last_name']
    staff_category_id = data['staff_category_id']
    sex = data['sex']
    phone = data['phone']
    email = data['email']
    username = data['username']
    password = data['password']



    success = updaterecord('staff', staff_id=staff_id, first_name=first_name, last_name=last_name, staff_category_id=staff_category_id, sex=sex, phone=phone, email=email, username=username, password=password)

    return jsonify({'success' : success})

@app.route('/updatepatient', methods=['POST'])
def update_patient():
    data = request.get_json()
    patient_id = data['patient_id']
    del data['patient_id']
    success = updatepatients(patient_id, **data)

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


@app.route('/getstaffandcateg', methods=['GET'])
def getstaffandcateg():
    data = getstaffandcategories()
    return jsonify(data)

# -----------------------------------DELETE----------------------------

@app.route('/deleteitem', methods=['POST'])
def delete_item():
    data = request.get_json()
    
    success = updaterecord('supplies', **data)

    return jsonify({'success' : success})

@app.route('/deletepatientallergies', methods=['POST'])
def delete_patient_allergies():
    data = request.get_json()
    patient_id = data['patient_id']
    allergies = data['allergies']
    success = True
    for item in allergies:
        success = deletemedical('patient_allergies', patient_id=patient_id, allergy_id=item)

    return jsonify({'success' : success})

@app.route('/addallergies', methods=['POST'])
def add_allergies():
    data = request.get_json()
    patient_id = data['patient_id']
    allergies = data['allergies']
    success = True

    for item in allergies:
        success = addrecord('patient_allergies', patient_id=patient_id, allergy_id=item)
    
    return jsonify({'success' : success})

@app.route('/deletepatientconditions', methods=['POST'])
def delete_patient_conditions():
    data = request.get_json()
    patient_id = data['patient_id']
    conditions = data['conditions']
    success = True

    for item in conditions:
        success = deletemedical('patient_conditions', patient_id=patient_id, condition_id=item)
    
    return jsonify({'success' : success})

@app.route('/addconditions', methods=['POST'])
def add_conditions():
    data = request.get_json()
    patient_id = data['patient_id']
    conditions = data['conditions']
    success = True

    for item in conditions:
        addrecord('patient_conditions', patient_id=patient_id, condition_id=item)
    
    return jsonify({'success' : success})

@app.route('/updatesupply', methods=['POST'])
def update_supply():
    data = request.get_json()
    success = updaterecord('supplies', **data)

    return jsonify({'success' : success})

if __name__=="__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))