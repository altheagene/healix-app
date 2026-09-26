from db.connection import getprocess, postprocess

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

def getallwithcondition(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())
    sql = f'SELECT * FROM {table} WHERE `{keys[0]}` = ?'

    return getprocess(sql, values)

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

def deletemedical(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())

    sql = f'''
        DELETE from {table}
        WHERE `{keys[0]}` = ? AND `{keys[1]}` = ?
    '''

    return postprocess(sql, values)

def deleterecord(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())

    sql = f'''
        DELETE from {table}
        WHERE `{keys[0]}` = ?
    '''

    return postprocess(sql, values)

def main(): pass
    # data = getallstudents('students')

    # for dat in data:
    #     print(f"{dat['student_id']}")
    

if __name__ == '__main__':
    main()
