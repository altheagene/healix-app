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

def getitemdetails(table, **kwargs):
    keys = list(kwargs.keys())
    values = list(kwargs.values())

    sql = f'''
    SELECT s.supply_id, s.supply_name, s.description, c.category_name, s.brand, s.description, s.auto_deduct
    FROM {table} s 
    INNER JOIN supplies_categories c on  s.category_id = c.category_id 
    WHERE s.supply_id = ?

    '''
    return getprocess(sql, values)

# def getallmedicine():
#     sql = f'SELECT * from supplies WHERE category_id = 1'

#     data = getprocess(sql, [])

#     return data

def getallmedicine():
    sql = '''
        SELECT 
            s.supply_id,
            s.supply_name,
            s.auto_deduct,
            COALESCE(SUM(b.stock_level), 0) AS available_stock
        FROM supplies s
        LEFT JOIN batches b 
            ON b.supply_id = s.supply_id
            AND b.is_active = 1
        WHERE s.category_id = 1 
          AND s.is_active = 1
        GROUP BY s.supply_id, s.supply_name, s.auto_deduct
        HAVING COALESCE(SUM(b.stock_level), 0) > 0;
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
        i.item_out
    FROM inventory i
    JOIN batches b ON i.batch_id = b.batch_id
    JOIN supplies s ON b.supply_id = s.supply_id
    WHERE DATE(i.inv_date) BETWEEN ? AND ?
    ORDER BY i.inv_id DESC;

    '''

    data = getprocess(sql, values)

    return data

def getallsupplies():
    sql = f"""
       SELECT
    s.supply_id,
    s.supply_name,
    s.is_active,
    sc.category_name,
    COALESCE(b.total_stock, 0) AS total_stock,
    i.last_updated
FROM supplies s
JOIN supplies_categories sc 
    ON sc.category_id = s.category_id

LEFT JOIN (
    SELECT
        supply_id,
        SUM(stock_level) AS total_stock
    FROM batches
    GROUP BY supply_id
) b ON b.supply_id = s.supply_id

LEFT JOIN (
    SELECT
        bt.supply_id,
        MAX(inv.inv_date) AS last_updated
    FROM batches bt
    JOIN inventory inv 
        ON inv.batch_id = bt.batch_id
    GROUP BY bt.supply_id
) i ON i.supply_id = s.supply_id

ORDER BY s.supply_name;


            """

    data = getprocess(sql, [])

    return data

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
