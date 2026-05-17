import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv("d:\\EventManager\\AI\\.env")

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(connection_string)

with engine.connect() as conn:
    print('\n--- Clearing Chat History for User ---')
    conn.execute(text("DELETE FROM chat_history WHERE account_id = 'f2f73ee7-73dc-4b78-805c-ca04d8f9e1e6'"))
    conn.commit()
    print('Cleared chat history successfully!')
