from flask import Flask, jsonify, redirect, url_for, request
from flask_cors import CORS
import sys
sys.path.insert(0, '/db')
from db.dbhelper import *

app = Flask(__name__)
# CORS(app, resources={r"/*" : {"origins":"*"}} )
CORS(app)

@app.route('/findstudent', methods=['GET'])
def find_student():
    idnum = request.args.get('idnum')
    data = findstudent('students', student_id=idnum)
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
    data = getallwithcondition('patient_allergies', patient_id=patient_id)

    return jsonify(data)

@app.route('/getpatientallergies', methods=['GET'])
def get_patient_conditions():
    patient_id = request.args.get('idnum')
    data = getallwithcondition('patient_conditions', patient_id=patient_id)

    return jsonify(data)

@app.route('/getallsupplies', methods=['GET'])
def get_all_supplies():
    data = getall('supplies')
    return jsonify(data)

@app.route('/getsupplydetails', methods=['GET'])
def get_supply_details():
    supply_id = request.args.get('idnum')
    supply_info = getitemdetails('supplies', supply_id=supply_id)

    return jsonify(supply_info)

@app.route('/getallservices', methods=['GET'])
def get_all_services():
    data = getall('services')
    return jsonify(data)
# ----------------------INSERT QUERIES----------------------------

@app.route('/addpatient', methods=['POST'])
def add_patient():
    data = request.get_json()
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

if __name__=="__main__":
    app.run(debug=True, port=5000)