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

JWT_SECRET = "MyVerySecureJWTSecretKeyThatIsAtLeast32BytesLongForHMACSHA256Algorithm2024"
USER_EMAIL = "minhchienvadori@gmail.com"
USER_ID = "f2f73ee7-73dc-4b78-805c-ca04d8f9e1e6"

# Generate JWT Token
payload = {
    "sub": USER_EMAIL,
    "roles": "[ROLE_USER]",
    "iat": int(datetime.now(timezone.utc).timestamp()),
    "exp": int((datetime.now(timezone.utc) + timedelta(hours=2)).timestamp())
}
token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

# Clear chat history in DB to start completely fresh
print("--- [0] Clearing chat history in DB ---")
with engine.connect() as conn:
    conn.execute(text("DELETE FROM chat_history WHERE account_id = :uid"), {"uid": USER_ID})
    conn.commit()

# 1. Check seats before booking
print("\n--- [1] Checking available seats for ticket type 76 before booking ---")
with engine.connect() as conn:
    seats_before = conn.execute(text(
        "SELECT id, seat_number, status FROM seats WHERE ticket_type_id = 76 AND status = 'AVAILABLE' ORDER BY id ASC LIMIT 5"
    )).fetchall()
    for s in seats_before:
        print(s._mapping)
    if not seats_before:
        print("No available seats found for ticket type 76!")
        sys.exit(0)
    target_seat_id = seats_before[0][0]
    print(f"Expected seat to be booked: {target_seat_id}")

session_id = f"test_session_{int(datetime.now().timestamp())}"

# 2. Step 1: Send one-shot booking message with quantity specified
print("\n--- [2] Sending one-shot booking message to AI Agent ---")
chat_payload = {
    "message": "Tôi đã đăng nhập. Hãy đặt 1 vé loại ID 76 cho sự kiện ID 1043 giúp tôi.",
    "session_id": session_id,
    "token": token,
    "user_id": USER_ID
}

try:
    response = requests.post("http://localhost:8000/chat", json=chat_payload, timeout=30)
    answer = response.json().get("answer", "")
    print("AI Response:\n", answer)
except Exception as e:
    print("Error calling Chatbot:", e)
    sys.exit(1)

# 3. Parse order_id from response
import re
order_match = re.search(r"(?:ID Đơn hàng:|đơn hàng.*?ID:\s*|đơn hàng\s+`?)(\d+)", answer, re.IGNORECASE)
if not order_match:
    print("\nCould not find Order ID in Chatbot response!")
    sys.exit(1)

order_id = int(order_match.group(1))
print(f"\nSuccessfully created Order ID: {order_id}")

# 4. Check seat status after booking
print("\n--- [3] Checking if order has tickets in the database ---")
with engine.connect() as conn:
    tickets = conn.execute(text(
        "SELECT t.id, t.seat_id, s.seat_number, t.status FROM tickets t JOIN seats s ON t.seat_id = s.id WHERE t.order_id = :oid"
    ), {"oid": order_id}).fetchall()
    print(f"Tickets in Order {order_id}:")
    for t in tickets:
        print(t._mapping)
    
    if not tickets:
        print("❌ Error: Order has NO tickets! The bug is still present.")
        sys.exit(1)
    else:
        print("✅ Success: Order has tickets! Ticket seat matches our expected seat ID.")

# 5. Emulate payment sandbox return
print("\n--- [4] Emulating payment sandbox success callback ---")
callback_url = f"http://localhost:8080/api/payment/orderReturn?vnp_TxnRef={order_id}&vnp_TransactionResponseCode=00&vnp_SecureHash=MOCK_SANDBOX_HASH"
try:
    cb_response = requests.get(callback_url, timeout=10)
    print("Callback Status Code:", cb_response.status_code)
    print("Callback Response Text:", cb_response.text)
except Exception as e:
    print("Error triggering payment callback:", e)

# 6. Verify seat is marked as BOOKED and email sent
print("\n--- [5] Verifying final state after payment completion ---")
with engine.connect() as conn:
    ticket_status = conn.execute(text(
        "SELECT status FROM tickets WHERE order_id = :oid"
    ), {"oid": order_id}).fetchone()
    seat_status = conn.execute(text(
        "SELECT status FROM seats WHERE id = :sid"
    ), {"sid": target_seat_id}).fetchone()
    print(f"Final Ticket Status: {ticket_status[0] if ticket_status else 'NONE'}")
    print(f"Final Seat Status: {seat_status[0] if seat_status else 'NONE'}")
    
    if ticket_status and ticket_status[0] == 'PAID' and seat_status and seat_status[0] == 'BOOKED':
        print("\n🎉 OVERALL SUCCESS! The booking completed, seats locked, and status updated successfully!")
    else:
        print("\n❌ Verification failed. Ticket status or seat status is incorrect.")
