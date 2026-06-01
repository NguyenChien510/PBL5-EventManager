import os
import sys
from sqlalchemy import create_engine, text
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

with engine.connect() as conn:
    print("--- Event Revenue SQL Check ---")
    events = conn.execute(text("SELECT id, title FROM events LIMIT 5")).fetchall()
    for e in events:
        event_id = e[0]
        query = text("""
            SELECT 
                COALESCE(SUM(tt.price), 0) AS total_revenue,
                COUNT(t.id) AS tickets_sold
            FROM tickets t
            JOIN seats s ON t.seat_id = s.id
            JOIN ticket_types tt ON s.ticket_type_id = tt.id
            JOIN event_sessions es ON tt.event_session_id = es.id
            JOIN orders o ON t.order_id = o.id
            WHERE es.event_id = :event_id
              AND o.status = 'COMPLETED'
        """)
        res = conn.execute(query, {"event_id": event_id}).fetchone()
        print(f"Event {event_id} ({e[1]}): Revenue = {res[0]}, Sold = {res[1]}")
