import sqlite3
try:
    conn = sqlite3.connect('backend/disease_radar.db')
    c = conn.cursor()
    c.execute('SELECT name FROM sqlite_master WHERE type="table"')
    tables = c.fetchall()
    print(f"Tables: {tables}")
    
    if tables:
        c.execute('PRAGMA table_info(reports)')
        columns = c.fetchall()
        print(f"Reports table columns: {columns}")
        
        c.execute('SELECT COUNT(*) FROM reports')
        count = c.fetchone()[0]
        print(f"Total reports: {count}")
        
        if count > 0:
            c.execute('SELECT id, pincode, cell, symptoms FROM reports LIMIT 5')
            for row in c.fetchall():
                print(f"ID: {row[0]}, Pincode: {row[1]}, Cell: {row[2]}, Symptoms: {row[3]}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
