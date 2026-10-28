from db.connection import getprocess, insertprocess, postprocess

# Column names cannot be SQL placeholders, and many routes pass request JSON keys
# straight through as columns. Only the columns listed here may be written.
WRITABLE_COLUMNS = {
    "staff": {"staff_id", "first_name", "middle_name", "last_name", "staff_category_id",
              "birthday", "sex", "phone", "email", "username", "password"},
    "patients": {"patient_id", "is_student", "student_id", "department", "level", "first_name",
                 "middle_name", "last_name", "birthday", "sex", "email", "phone", "notes",
                 "emergency_contact_name", "emergency_contact_phone", "archived"},
    "allergies": {"allergy_id", "allergy_name"},
    "conditions": {"condition_id", "condition_name"},
    "patient_allergies": {"patient_id", "allergy_id"},
    "patient_conditions": {"patient_id", "condition_id"},
    "supplies": {"supply_id", "supply_name", "brand", "category_id", "description",
                 "auto_deduct", "is_active"},
    "batches": {"batch_id", "supply_id", "batch_number", "expiration_date", "stock_level",
                "is_active"},
    "inventory": {"inv_id", "inv_date", "batch_id", "item_in", "item_out"},
    "appointments": {"appointment_id", "appointment_date", "patient_id", "service_id",
                     "start_time", "status", "notes"},
    "services": {"service_id", "service_name"},
    "visit_logs": {"visit_id", "appointment_id", "patient_id", "service_id", "staff_id",
                   "visit_datetime", "weight", "temperature", "notes",
                   "complaint", "assessment", "treatment", "time_in", "time_out", "disposition",
                   "referred_to", "picked_up_by", "picked_up_at"},
}

# updaterecord always matches rows on this column, never on a key the client picked.
PRIMARY_KEYS = {
    "staff": "staff_id",
    "patients": "patient_id",
    "allergies": "allergy_id",
    "conditions": "condition_id",
    "supplies": "supply_id",
    "batches": "batch_id",
    "inventory": "inv_id",
    "appointments": "appointment_id",
    "services": "service_id",
    "visit_logs": "visit_id",
}


def checked_columns(table, keys):
    """Return keys unchanged, or raise ValueError if any is not a writable column of table."""
    allowed = WRITABLE_COLUMNS.get(table.lower())
    if allowed is None:
        raise ValueError(f"Writes to {table} are not allowed")
    unknown = [key for key in keys if str(key).lower() not in allowed]
    if unknown:
        raise ValueError(f"Unknown columns for {table}: {unknown}")
    return keys

#----------------------------------------PATIENTS MODULE------------------------------

def getall(table):
    sql = f'SELECT * FROM {table}'
    data = getprocess(sql, [])
    return data

def getrecord(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())
    sql = f'SELECT * FROM {table} WHERE `{keys[0]}` = ?'

    data = getprocess(sql, values)

    return data

def addrecord(table, **kwargs):
    return insertrecord(table, **kwargs) is not None


def insertrecord(table, **kwargs):
    """Inserts a row and returns its new id, or None if it failed."""
    keys = list(kwargs.keys())
    values = list(kwargs.values())
    try:
        checked_columns(table, keys)
    except ValueError as e:
        print("POST error:", e)
        return None

    placeholder = ['?']*len(values)
    stringifiedph = ','.join(placeholder)
    stringifiedkeys = "`,`".join(keys)

    sql = f'INSERT INTO {table} (`{stringifiedkeys}`) values({stringifiedph})'

    return insertprocess(sql, values)

def updaterecord(table, **kwargs):
    primary_key = PRIMARY_KEYS.get(table.lower())
    if primary_key is None or kwargs.get(primary_key) in (None, ""):
        print("POST error: update needs", primary_key or "a known table")
        return False

    fields = {key: value for key, value in kwargs.items() if key != primary_key}
    try:
        checked_columns(table, fields.keys())
    except ValueError as e:
        print("POST error:", e)
        return False
    if not fields:
        return False

    stringifykeys = ','.join(f'`{key}` = ?' for key in fields)
    params = [*fields.values(), kwargs[primary_key]]
    sql = f'''
            UPDATE {table}
            SET {stringifykeys}
            WHERE `{primary_key}` = ?
           '''
    return postprocess(sql, params)

def deletemedical(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())
    try:
        checked_columns(table, keys)
    except ValueError as e:
        print("POST error:", e)
        return False

    sql = f'''
        DELETE from {table}
        WHERE `{keys[0]}` = ? AND `{keys[1]}` = ?
    '''

    return postprocess(sql, values)

def deleterecord(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())
    try:
        checked_columns(table, keys)
    except ValueError as e:
        print("POST error:", e)
        return False

    sql = f'''
        DELETE from {table}
        WHERE `{keys[0]}` = ?
    '''

    return postprocess(sql, values)
