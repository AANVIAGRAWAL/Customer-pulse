import os
import sys
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_connection import get_db_connection

def execute_schema():
    engine = get_db_connection()
    if not engine:
        return
        
    schema_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'schema', '01_init.sql')
    
    with open(schema_path, 'r') as f:
        sql_script = f.read()
        
    statements = [stmt.strip() for stmt in sql_script.split(';') if stmt.strip()]
    
    with engine.connect() as conn:
        for stmt in statements:
            if stmt:
                try:
                    conn.execute(text(stmt))
                except Exception as e:
                    print(f"Failed to execute statement:\n{stmt}\nError: {e}")
                    raise
        conn.commit()
    print("Schema executed successfully!")

if __name__ == "__main__":
    execute_schema()
