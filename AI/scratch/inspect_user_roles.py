import os
import sys
from sqlalchemy import create_engine, inspect, text
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv(dotenv_path="d:\\EventManager\\AI\\.env")

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(connection_string)

insp = inspect(engine)

with engine.connect() as conn:
    print("\n--- Users sample ---")
    users = conn.execute(text("SELECT id, email, full_name FROM users LIMIT 10")).fetchall()
    for u in users:
        print(u._mapping)
        
    print("\n--- Roles table ---")
    roles = conn.execute(text("SELECT id, name FROM roles")).fetchall()
    for r in roles:
        print(r._mapping)
        
    # Check if there is an account_roles or user_roles table or if users has a role_id
    for t in insp.get_table_names():
        if 'role' in t and t != 'roles':
            print(f"\n--- Table {t} ---")
            cols = insp.get_columns(t)
            print([c['name'] for c in cols])
            rows = conn.execute(text(f"SELECT * FROM {t} LIMIT 5")).fetchall()
            for r in rows:
                print(r._mapping)
                
    # Check if users table has role columns or similar
    print("\n--- Users columns ---")
    for c in insp.get_columns('users'):
        print(c['name'], c['type'])
