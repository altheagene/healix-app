from sqlite3 import Row, connect
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))   # points to /backend/db
database = os.path.join(BASE_DIR, "clinic.db")

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
    cursor = conn.cursor()
    cursor.execute(sql, values)
    conn.commit()
    rowcount = cursor.rowcount
    cursor.close()

    return rowcount > 0

def main():
    data = getallstudents('students')

    for dat in data:
        print(f"{dat['student_id']}")

if __name__ == '__main__':
    main()
