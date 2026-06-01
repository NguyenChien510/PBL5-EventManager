import os
import sys
import requests
import jwt
from datetime import datetime, timezone, timedelta
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

# 1. Fetch test users and events
with engine.connect() as conn:
    # Get an event that has an organizer
    event_row = conn.execute(text("SELECT id, title, organizer_id FROM events WHERE organizer_id IS NOT NULL LIMIT 1")).fetchone()
    if not event_row:
        print("Error: No events with organizer_id found in database!")
        sys.exit(1)
    
    event_id, event_title, organizer_uuid = event_row[0], event_row[1], event_row[2]
    print(f"Test Event: {event_title} (ID: {event_id}, Organizer UUID: {organizer_uuid})")
    
    # Get the email of that organizer
    org_user = conn.execute(text("SELECT email FROM users WHERE id = :uid"), {"uid": organizer_uuid}).fetchone()
    if not org_user:
        print("Error: Organizer user not found in users table!")
        sys.exit(1)
    org_email = org_user[0]
    print(f"Organizer Email: {org_email}")
    
    # Get another organizer user (different from the event's organizer)
    other_org_user = conn.execute(text("SELECT email, id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'ORGANIZER') AND id != :uid LIMIT 1"), {"uid": organizer_uuid}).fetchone()
    if not other_org_user:
        # Fallback to any other user email if not enough organizers
        other_org_user = conn.execute(text("SELECT email, id FROM users WHERE id != :uid LIMIT 1"), {"uid": organizer_uuid}).fetchone()
        
    other_org_email = other_org_user[0] if other_org_user else "other@gmail.com"
    print(f"Other Organizer Email: {other_org_email}")
    
    # Get an admin user email
    admin_user = conn.execute(text("SELECT email FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'ADMIN') LIMIT 1")).fetchone()
    if not admin_user:
        admin_user = conn.execute(text("SELECT email FROM users LIMIT 1")).fetchone()
    admin_email = admin_user[0]
    print(f"Admin Email: {admin_email}")

JWT_SECRET = "MyVerySecureJWTSecretKeyThatIsAtLeast32BytesLongForHMACSHA256Algorithm2024"

def make_token(email: str, role: str):
    payload = {
        "sub": email,
        "roles": f"[{role}]",
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(hours=2)).timestamp())
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

token_admin = make_token(admin_email, "ROLE_ADMIN")
token_org_owner = make_token(org_email, "ROLE_ORGANIZER")
token_org_other = make_token(other_org_email, "ROLE_ORGANIZER")

# Check if port 8000 is active.
try:
    resp = requests.get("http://localhost:8000/", timeout=2)
    print("Chatbot server is online:", resp.json())
except Exception:
    print("Chatbot server is offline. Please start it to run verification.")
    sys.exit(1)

def send_chat_stream(message: str, token: str):
    payload = {
        "message": message,
        "session_id": f"test_session_{int(datetime.now().timestamp())}",
        "token": token
    }
    try:
        # Use stream endpoint to verify context vars propagation
        response = requests.post("http://localhost:8000/chat/stream", json=payload, timeout=20, stream=True)
        import json
        full_answer = ""
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                if decoded_line.startswith('data: '):
                    try:
                        data = json.loads(decoded_line[6:])
                        if data.get('type') == 'result':
                            full_answer = data.get('answer', '')
                        elif data.get('type') == 'error':
                            full_answer = f"Error: {data.get('message')}"
                    except Exception:
                        pass
        return full_answer
    except Exception as e:
        return f"Request exception: {e}"

# Test 1: Admin requesting revenue (Allowed)
print("\n--- TEST 1: Admin requesting Event Revenue (Allowed globally) ---")
res = send_chat_stream(f"Hãy cho tôi biết doanh thu của sự kiện ID {event_id}", token_admin)
print("Admin Response:\n", res)

# Test 2: Event Organizer Owner requesting revenue (Allowed)
print("\n--- TEST 2: Organizer Owner requesting Event Revenue (Allowed for owned event) ---")
res = send_chat_stream(f"Hãy cho tôi biết doanh thu của sự kiện ID {event_id}", token_org_owner)
print("Organizer Owner Response:\n", res)

# Test 3: Other Organizer requesting revenue (Blocked by ownership check)
print("\n--- TEST 3: Other Organizer requesting Event Revenue (Blocked by ownership check) ---")
res = send_chat_stream(f"Hãy cho tôi biết doanh thu của sự kiện ID {event_id}", token_org_other)
print("Other Organizer Response:\n", res)
