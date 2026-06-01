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

# 1. Fetch a user email from database
with engine.connect() as conn:
    user = conn.execute(text("SELECT email FROM users LIMIT 1")).fetchone()
    if not user:
        print("Error: No users found in database!")
        sys.exit(1)
    user_email = user[0]
    print(f"Using user email for tests: {user_email}")

JWT_SECRET = "MyVerySecureJWTSecretKeyThatIsAtLeast32BytesLongForHMACSHA256Algorithm2024"

# Generate User Token
payload_user = {
    "sub": user_email,
    "roles": "[ROLE_USER]",
    "iat": int(datetime.now(timezone.utc).timestamp()),
    "exp": int((datetime.now(timezone.utc) + timedelta(hours=2)).timestamp())
}
token_user = jwt.encode(payload_user, JWT_SECRET, algorithm="HS256")

# Generate Organizer Token (prefixed)
payload_org_prefixed = {
    "sub": user_email,
    "roles": "[ROLE_ORGANIZER]",
    "iat": int(datetime.now(timezone.utc).timestamp()),
    "exp": int((datetime.now(timezone.utc) + timedelta(hours=2)).timestamp())
}
token_org_prefixed = jwt.encode(payload_org_prefixed, JWT_SECRET, algorithm="HS256")

# Generate Organizer Token (raw)
payload_org_raw = {
    "sub": user_email,
    "roles": "[ORGANIZER]",
    "iat": int(datetime.now(timezone.utc).timestamp()),
    "exp": int((datetime.now(timezone.utc) + timedelta(hours=2)).timestamp())
}
token_org_raw = jwt.encode(payload_org_raw, JWT_SECRET, algorithm="HS256")

# Check if port 8000 is active. If not, start server or tell user.
try:
    resp = requests.get("http://localhost:8000/", timeout=2)
    print("Chatbot server is online:", resp.json())
except Exception:
    print("Chatbot server is offline. Please start it to run verification.")
    sys.exit(1)

def send_chat(message: str, token: str = None):
    payload = {
        "message": message,
        "session_id": "test_session_id",
        "token": token
    }
    try:
        response = requests.post("http://localhost:8000/chat", json=payload, timeout=20)
        if response.status_code == 200:
            return response.json().get("answer", "")
        else:
            return f"Error {response.status_code}: {response.text}"
    except Exception as e:
        return f"Request exception: {e}"

# Test 1: Guest (No token)
print("\n--- TEST 1: Guest (No Token) ---")
print("Message: 'Sự kiện ID 1048 bán được bao nhiêu tiền?'")
res = send_chat("Sự kiện ID 1048 bán được bao nhiêu tiền?", token=None)
print("Guest Response:\n", res)

# Test 2: User (ROLE_USER)
print("\n--- TEST 2: Regular User (ROLE_USER) ---")
print("Message: 'Sự kiện ID 1048 bán được bao nhiêu tiền?'")
res = send_chat("Sự kiện ID 1048 bán được bao nhiêu tiền?", token=token_user)
print("User Response:\n", res)

# Test 3: Organizer (ROLE_ORGANIZER - prefixed)
print("\n--- TEST 3: Organizer (ROLE_ORGANIZER - Prefixed) ---")
print("Message: 'Sự kiện VBA 2025 bán được bao nhiêu tiền?'")
res = send_chat("Sự kiện VBA 2025 bán được bao nhiêu tiền?", token=token_org_prefixed)
print("Organizer Prefixed Response:\n", res)

# Test 4: Organizer (ORGANIZER - raw)
print("\n--- TEST 4: Organizer (ORGANIZER - Raw) ---")
print("Message: 'Sự kiện VBA 2025 bán được bao nhiêu tiền?'")
res = send_chat("Sự kiện VBA 2025 bán được bao nhiêu tiền?", token=token_org_raw)
print("Organizer Raw Response:\n", res)
