from sqlite3 import Row, connect
import os

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
