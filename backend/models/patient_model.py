"""Patient, allergy, and condition queries. No Flask code lives here."""

from sqlite3 import Row, connect

from db.connection import getprocess, postprocess, studentdb
from db.dbhelper import addrecord, deletemedical, getall, getmaxid


def find_student_record(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())

    sql = f"SELECT * FROM {table} WHERE `{keys[0]}` = ?"
    return getprocess(sql, values)


def get_student(**kwargs):
    try:
        keys = list(kwargs.keys())
        values = list(kwargs.values())

        sql = f"SELECT * FROM students WHERE `{keys[0]}` = ?"
        conn = connect(studentdb)
        conn.row_factory = Row
        cursor = conn.cursor()
        cursor.execute(sql, values)
        data = cursor.fetchall()
        cursor.close()
        conn.close()
    except Exception as e:
        cursor.close()
        conn.close()
        print(e)

    return [dict(row) for row in data]


def get_allergies(table="allergies"):
    sql = f"SELECT * FROM {table}"
    return getprocess(sql, [])


def get_conditions(table="conditions"):
    sql = f"SELECT * from {table}"
    return getprocess(sql, [])


def get_all_patients():
    return getall("patients")


def get_max_patient_id():
    return getmaxid("patients", "patient_id")


def get_patient(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())

    sql = f"SELECT * FROM {table} WHERE `{keys[0]}` = ?"
    return getprocess(sql, values)


def get_patient_allergies(**kwargs):
    values = list(kwargs.values())
    sql = """
        SELECT
            pa.allergy_id,
            a.allergy_name
        FROM patient_allergies pa
        JOIN allergies a on a.allergy_id = pa.allergy_id
        WHERE pa.patient_id = ?
    """
    return getprocess(sql, values)


def get_patient_conditions(**kwargs):
    values = list(kwargs.values())
    sql = """
        SELECT
            pc.condition_id,
            c.condition_name
        FROM patient_conditions pc
        JOIN conditions c on c.condition_id = pc.condition_id
        WHERE pc.patient_id = ?
    """
    return getprocess(sql, values)


def add_patient(**fields):
    return addrecord("patients", **fields)


def add_allergy(**fields):
    return addrecord("allergies", **fields)


def add_condition(**fields):
    return addrecord("conditions", **fields)


def add_patient_allergy(patient_id, allergy_id):
    return addrecord("patient_allergies", patient_id=patient_id, allergy_id=allergy_id)


def add_patient_condition(patient_id, condition_id):
    return addrecord("patient_conditions", patient_id=patient_id, condition_id=condition_id)


def delete_patient_allergy(patient_id, allergy_id):
    return deletemedical("patient_allergies", patient_id=patient_id, allergy_id=allergy_id)


def delete_patient_condition(patient_id, condition_id):
    return deletemedical("patient_conditions", patient_id=patient_id, condition_id=condition_id)


def update_patient(patient_id, **fields):
    keys = list(fields.keys())
    values = list(fields.values())

    listkeys = []
    for x in range(0, len(keys)):
        listkeys.append(f"`{keys[x]}` = ?")

    stringifykeys = ",".join(listkeys)

    sql = f"""
            UPDATE patients
            SET {stringifykeys}
            WHERE `patient_id` = ?
           """
    return postprocess(sql, [*values, patient_id])
