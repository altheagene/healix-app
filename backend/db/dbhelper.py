from sqlite3 import Row, connect
import os
from datetime import date

BASE_DIR = os.path.dirname(os.path.abspath(__file__))   # points to /backend/db
database = os.path.join(BASE_DIR, "clinic.db")
studentdb = os.path.join(BASE_DIR, "student.db")

#----------------------------------------PATIENTS MODULE------------------------------

def getall(table):
    sql = f'SELECT * FROM {table}'
    data = getprocess(sql, [])
    return data

def findstudent(table:str, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())

    sql = f'SELECT * FROM {table} WHERE `{keys[0]}` = ?'
    print(sql)
    data = getprocess(sql, values)

    return data

def getrecord(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())
    sql = f'SELECT * FROM {table} WHERE `{keys[0]}` = ?'

    data = getprocess(sql, values)

    return data

def getstudent(**kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())
    
    sql = f'SELECT * FROM students WHERE `{keys[0]}` = ?'
    conn = connect(database)
    conn.row_factory = Row
    cursor = conn.cursor()
    cursor.execute(sql, values)
    data = cursor.fetchall()
    cursor.close()

    return [dict(row) for row in data]
    

def getallergies(string = 'allergies'):
    sql = f'SELECT * FROM {string}'
    data = getprocess(sql, [])
    return data

def getconditions(string ='conditions'):
    sql = f'SELECT * from {string}'
    data = getprocess(sql, [])
    return data

def getmaxid(table, id):
    sql= f'SELECT MAX ({id}) AS last_id FROM {table}'
    data = getprocess(sql, [])
    return data


def addrecord(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())

    placeholder = ['?']*len(values)
    stringifiedph = ','.join(placeholder)
    stringifiedkeys = "`,`".join(keys)

    sql = f'INSERT INTO {table} (`{stringifiedkeys}`) values({stringifiedph})'

    return postprocess(sql, values)

def getpatient(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())

    sql = f'SELECT * FROM {table} WHERE `{keys[0]}` = ?'

    return getprocess(sql, values)

def getallwithcondition(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())
    sql = f'SELECT * FROM {table} WHERE `{keys[0]}` = ?'

    return getprocess(sql, values)

def getitemdetails(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())

    sql = f'''
    SELECT s.supply_id, s.supply_name, s.description, c.category_name, s.brand, s.description 
    FROM {table} s 
    INNER JOIN supplies_categories c on  s.category_id = c.category_id 
    WHERE s.supply_id = ?

    '''
    return getprocess(sql, values)

def getstaffandcategories():
    sql = f'''
            SELECT 
            s.staff_id,
            s.first_name,
            s.last_name,
            s.staff_category_id,
            sc.category_name,
            s.sex,
            s.phone,
            s.email,
            s.username
            FROM staff s
            JOIN staff_categories sc
            ON s.staff_category_id = sc.staff_category_id;
            '''
    return getprocess(sql, [])

# def getallmedicine():
#     sql = f'SELECT * from supplies WHERE category_id = 1'

#     data = getprocess(sql, [])

#     return data

def getallmedicine():
    sql = f'''
            SELECT 
            s.supply_id,
            s.supply_name,
            s.auto_deduct,
            COALESCE(SUM(b.stock_level), 0) AS available_stock
            FROM Supplies s
            LEFT JOIN batch b ON b.supply_id = s.supply_id
            WHERE s.category_id = 1
            GROUP BY s.supply_id;
            '''
    data = getprocess(sql, [])

    return data

def updatestock(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())

    sql = f'''
            UPDATE {table}
            SET stock_level = stock_level +  ? 
            WHERE batch_id = ?
            '''

    return postprocess(sql, values)

def updaterecord(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())

    listkeys = []
    listvalues = []
    for x in range(1, len(keys)):
        listkeys.append(f'`{keys[x]}` = ?')
        listvalues.append(values[x])

    stringifykeys = ','.join(listkeys)
    
    sql = f'''
            UPDATE {table}
            SET {stringifykeys}
            WHERE `{keys[0]}` = {values[0]}
           '''
    return postprocess(sql, listvalues)

def deductbatch(supply_id, quantity):
    conn = connect(database)
    cursor = conn.cursor()

    # Get all batches with stock > 0, ordered by earliest expiration
    cursor.execute("""
        SELECT batch_id, stock_level
        FROM batch
        WHERE supply_id = ? AND stock_level > 0
        ORDER BY expiration_date ASC
    """, (supply_id,))
    
    batches = cursor.fetchall()  # [(batch_id, stock_level), ...]

    remaining = quantity

    for batch_id, stock in batches:
        cursor = conn.cursor()
        if remaining <= 0:
            break
        take = min(stock, remaining)
        cursor.execute("""
            UPDATE batch
            SET stock_level = stock_level - ?
            WHERE batch_id = ?
        """, (take, batch_id))
        remaining -= take

        cursor.execute(f'''
                        INSERT INTO INVENTORY (inv_date, batch_id, item_in, item_out)
                       values ({date.today()}, {batch_id}, 0, {take})
                       ''')

    if remaining > 0:
        print(f"Warning: Not enough stock for supply_id {supply_id}, {remaining} remaining!")

    conn.commit()
    cursor.close()

def getappointments():

    sql = """
    SELECT 
        a.appointment_id,
        a.appointment_date,
        a.start_time,
        a.status,
        a.notes,
        s.service_id,
        s.service_name,
        p.patient_id,
        p.first_name || ' ' || p.middle_name || ' ' || p.last_name AS patient_name
        FROM 
            appointments a
        JOIN 
            services s ON a.service_id = s.service_id
        JOIN 
            patients p ON a.patient_id = p.patient_id
        ORDER BY a.appointment_date, a.start_time
        """

    data = getprocess(sql, [])

    return data

def getclinicvisits(**kwargs):
    values = list(kwargs.values())
    print(values)
    sql = f"""
        SELECT 
                v.visit_id,
                v.visit_datetime,
                v.notes,
                s.service_id,
                s.service_name,
                p.patient_id,
                p.first_name || ' ' || p.middle_name || ' ' || p.last_name AS patient_name,
                st.staff_id,
                st.first_name || ' ' || st.last_name AS staff_name
            FROM visit_logs v
            JOIN services s ON v.service_id = s.service_id
            JOIN patients p ON v.patient_id = p.patient_id
            JOIN staff st ON v.staff_id = st.staff_id
            WHERE DATE(v.visit_datetime) BETWEEN ? AND ?
            ORDER BY v.visit_datetime;
            """

    data = getprocess(sql, values)

    return data

def getinventorylogs(**kwargs):
    values = list(kwargs.values())
    sql = f'''
        SELECT
        i.inv_id,
        i.inv_date,
        i.batch_id,
        b.batch_number,
        b.expiration_date,
        s.supply_id,
        s.supply_name,
        i.item_in,
        i.item_out,
        i.auto_update
    FROM inventory i
    JOIN batch b ON i.batch_id = b.batch_id
    JOIN supplies s ON b.supply_id = s.supply_id
    WHERE DATE(i.inv_date) BETWEEN ? AND ?
    ORDER BY i.inv_date DESC;

    '''

    data = getprocess(sql, values)

    return data

def getappointmentlogs(**kwargs):
    values = list(kwargs.values())
    sql = f'''
        SELECT
        a.appointment_id,
        a.service_id,
        s.service_name,
        a.appointment_date,
        a.start_time,
        a.status,
        p.patient_id,
        p.first_name || ' ' || p.middle_name || ' ' || p.last_name AS patient_name
    FROM appointments a
    JOIN services s ON s.service_id = a.service_id
    JOIN patients p ON a.patient_id = p.patient_id
    WHERE DATE(a.appointment_date) BETWEEN ? AND ?
    ORDER BY a.appointment_date DESC;

    '''

    data = getprocess(sql, values)

    return data

def getpatientcliniclogs(**kwargs):
    values = list(kwargs.values())
    sql = f"""
        SELECT 
                v.visit_id,
                v.visit_datetime,
                v.notes,
                s.service_id,
                s.service_name,
                p.patient_id,
                p.first_name || ' ' || p.middle_name || ' ' || p.last_name AS patient_name,
                st.staff_id,
                st.first_name || ' ' || st.last_name AS staff_name
            FROM visit_logs v
            JOIN services s ON v.service_id = s.service_id
            JOIN patients p ON v.patient_id = p.patient_id
            JOIN staff st ON v.staff_id = st.staff_id
            WHERE p.patient_id  = ?
            ORDER BY v.visit_datetime;
            """

    data = getprocess(sql, values)

    return data

def getallsupplies():
    sql = f"""
       SELECT
            s.supply_id,
            s.supply_name,
            sc.category_name,
            SUM(b.stock_level) AS total_stock,
            MAX(i.inv_date) AS last_updated
        FROM supplies s
        JOIN supplies_categories sc ON sc.category_id = s.category_id
        LEFT JOIN batch b ON b.supply_id = s.supply_id
        LEFT JOIN inventory i ON i.batch_id = b.batch_id
        GROUP BY s.supply_id, s.supply_name, sc.category_name
        ORDER BY s.supply_name;
            """

    data = getprocess(sql, [])

    return data


def getprocess(sql, values) -> list:
    conn = connect(database)
    conn.row_factory = Row
    cursor = conn.cursor()
    cursor.execute(sql, values)
    data = cursor.fetchall()
    cursor.close()

    return [dict(row) for row in data]

def postprocess(sql, values) -> bool:
    print(sql)
    conn = connect(database)
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()
    cursor.execute(sql, values)
    conn.commit()
    rowcount = cursor.rowcount
    cursor.close()

    return rowcount > 0

def main(): pass
    # data = getallstudents('students')

    # for dat in data:
    #     print(f"{dat['student_id']}")
    

if __name__ == '__main__':
    main()
