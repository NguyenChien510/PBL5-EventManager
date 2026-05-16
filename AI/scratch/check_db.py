import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Ensure UTF-8 output
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

load_dotenv('d:/EventManager/AI/.env')

db_url = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
engine = create_engine(db_url)

print(f"Connecting to: {os.getenv('DB_HOST')}")

try:
    with engine.connect() as conn:
        print("\n--- 10 Most Recent Events (by Start Time) ---")
        result = conn.execute(text("SELECT id, title, start_time, status FROM events ORDER BY start_time DESC LIMIT 10"))
        for row in result:
            data = dict(row._mapping)
            print(f"ID: {data['id']} | {data['title']} | {data['start_time']} | Status: {data['status']}")
            
        print("\n--- Event Status Counts ---")
        result = conn.execute(text("SELECT status, count(*) as count FROM events GROUP BY status"))
        for row in result:
            data = dict(row._mapping)
            print(f"Status: {data['status']} | Count: {data['count']}")
            
except Exception as e:
    print(f"Error: {e}")
