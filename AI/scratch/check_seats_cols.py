import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(connection_string)

def check_seats_columns():
    query = """
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'seats';
    """
    with engine.connect() as conn:
        result = conn.execute(text(query))
        columns = [row[0] for row in result]
        print("Columns in 'seats' table:", columns)

if __name__ == "__main__":
    check_seats_columns()
