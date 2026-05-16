import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('d:/EventManager/AI/.env')
db_url = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
engine = create_engine(db_url)

with engine.connect() as conn:
    print("--- Listing all tables ---")
    result = conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"))
    for row in result:
        print(row[0])
