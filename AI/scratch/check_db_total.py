import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('d:/EventManager/AI/.env')
db_url = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
engine = create_engine(db_url)

with engine.connect() as conn:
    count = conn.execute(text("SELECT count(*) FROM events")).scalar()
    print(f"Total events in DB: {count}")
    
    if count > 0:
        print("\n--- 5 Random Events ---")
        result = conn.execute(text("SELECT id, title, start_time, status FROM events LIMIT 5"))
        for row in result:
            print(dict(row._mapping))
