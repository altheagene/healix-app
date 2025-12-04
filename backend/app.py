from flask import Flask, jsonify, redirect, url_for, request
from flask_cors import CORS
import sys
sys.path.insert(0, '/db')
from db.dbhelper import *
from datetime import date 

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

@app.route('/getallsuppliescategories', methods=['GET'])
def get_all_supplies_categorie():
    data = getall('supplies_categories')
    return jsonify(data)

@app.route('/getallmedicine')
def get_all_medicine():
    data = getallmedicine()
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

@app.route('/getstaffandcateg', methods=['GET'])
def getstaffandcateg():
    data = getstaffandcategories()
    return jsonify(data)

if __name__=="__main__":
    app.run(debug=True, port=5000)