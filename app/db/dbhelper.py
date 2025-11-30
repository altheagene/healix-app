from sqlite3 import Row, connect

database = 'clinic.db'

# STUDENT

def getallstudents(table = 'students'):
    sql = f'SELECT * FROM {table}'
    data = getprocess(sql, [])
    return data

def getprocess(sql, values) -> list:
    conn = connect(database)
    conn.row_factory = Row
    cursor = conn.cursor
    cursor.execute(sql, values)
    data = cursor.fetchall()

    return data

