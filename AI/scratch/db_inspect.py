import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

load_dotenv(dotenv_path="d:\\EventManager\\AI\\.env")

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(connection_string)
insp = inspect(engine)

for table in ['events', 'event_sessions', 'ticket_types', 'seats', 'orders', 'tickets']:
    cols = insp.get_columns(table)
    print(f"Table: {table}")
    for col in cols:
        print(f"  - {col['name']}: {col['type']}")
