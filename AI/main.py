import os
import logging
import traceback
import requests
from contextvars import ContextVar
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq
from langchain_qdrant import QdrantVectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_classic.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_classic.schema import Document
from langchain_classic.tools import tool
from langchain_classic.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.messages import HumanMessage, AIMessage
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from sqlalchemy import create_engine, text
import re
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="EventPlatform AI Assistant")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "event_platform")
# DB Config
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_KEY_2 = os.getenv("GROQ_API_KEY_2")
GROQ_API_KEY_3 = os.getenv("GROQ_API_KEY_3")
# Backend API
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
# Qdrant Cloud
QDRANT_URL = os.getenv("QDRANT_URL", "https://94e3d96c-ddc5-4a98-a77c-a4df1d317a03.australia-southeast1-0.gcp.cloud.qdrant.io")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6Mjc1NjM2MDYtZWM2Ni00NzA0LWE0OGQtNzgwNWZiNmVhZGE0In0.vSJCvzHTQkcirk826fyGJyNGcV3Vp7aMdps767w0b7g")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "event_platform")
# Session management for user login
# Global context for session tracking
current_session_id_var: ContextVar[str] = ContextVar("current_session_id", default="default_session")
user_sessions = {}  # session_id -> {"user_id": "...", "access_token": "..."}
current_session_token = None  # Token for current booking session

# Initialize components
# Sử dụng Gemini Embedding 2 mới nhất
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2", google_api_key=GOOGLE_API_KEY)

# Groq API failover: list of (api_key, ChatGroq) pairs
groq_keys = [GROQ_API_KEY]
for k in [GROQ_API_KEY_2, GROQ_API_KEY_3]:
    if k:
        groq_keys.append(k)
groq_clients = [(key, ChatGroq(model="openai/gpt-oss-120b", temperature=0, groq_api_key=key, max_retries=0)) for key in groq_keys]
groq_key_index = 0  # Track which key is currently active

# Safe SQL Middleware
class SafeSQLMiddleware:
    def __init__(self):
        self.connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        self.engine = create_engine(self.connection_string)
        self.forbidden_keywords = ["DROP", "DELETE", "UPDATE", "TRUNCATE", "ALTER", "INSERT", "GRANT", "REVOKE"]

    def execute(self, query: str):
        query_upper = query.upper().strip()
        if not query_upper.startswith("SELECT"):
            return "Lỗi: Chỉ cho phép truy vấn SELECT để đảm bảo an toàn."
        
        for word in self.forbidden_keywords:
            if re.search(rf"\b{word}\b", query_upper):
                return f"Lỗi: Truy vấn chứa từ khóa bị cấm ({word})."

        try:
            with self.engine.connect() as conn:
                # Wrap query to limit results
                safe_query = f"SELECT * FROM ({query.rstrip(';')}) AS sub LIMIT 15"
                result = conn.execute(text(safe_query))
                rows = [dict(row._mapping) for row in result]
                return rows if rows else "Không tìm thấy dữ liệu."
        except Exception as e:
            return f"Lỗi thực thi SQL: {str(e)}"

db_safe = SafeSQLMiddleware()

# Define Tools
@tool
def query_database(query: str):
    """Sử dụng để tra cứu dữ liệu chính xác từ database SQL (ví dụ: đếm số lượng, lọc giá, tìm địa điểm). Chỉ được dùng lệnh SELECT."""
    return db_safe.execute(query)

@tool
def search_events_semantic(query: str):
    """Sử dụng để tìm kiếm sự kiện dựa trên ý nghĩa, mô tả hoặc tư vấn chung khi không cần dữ liệu SQL chính xác."""
    vs = get_vectorstore()
    docs = vs.similarity_search(query, k=10)
    return "\n---\n".join([d.page_content for d in docs])

# ======== Booking Tools ========
@tool
def login_user(email: str, password: str, session_id: Optional[str] = None):
    """
    Đăng nhập người dùng để đặt vé.
    """
    global current_session_token
    try:
        sid = session_id or current_session_id_var.get()
        response = requests.post(
            f"{BACKEND_URL}/api/auth/signin",
            json={"email": email, "password": password},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            token = data.get("accessToken")
            user_id = data.get("user", {}).get("id")
            user_sessions[sid] = {
                "user_id": user_id,
                "access_token": token
            }
            current_session_token = token
            return f"Đăng nhập thành công! User: {data.get('user', {}).get('fullName')} (ID: {user_id})"
        else:
            return f"Đăng nhập thất bại: {response.text}"
    except Exception as e:
        return f"Lỗi đăng nhập: {str(e)}"

@tool
def search_events_api(keyword: str = "", category_id: str = "all", province: str = ""):
    """
    Tìm kiếm sự kiện qua API, trả về danh sách sự kiện.
    """
    try:
        params = {"keyword": keyword} if keyword else {}
        if category_id != "all":
            params["categoryId"] = category_id
        if province:
            params["province"] = province
        response = requests.get(f"{BACKEND_URL}/api/events/search", params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            # Handle both wrapped and unwrapped lists
            events = data.get("data", []) if isinstance(data, dict) else data
            if not events or not isinstance(events, list):
                return "Không tìm thấy sự kiện nào."
            result = "Danh sách sự kiện:\n"
            for e in events[:5]:
                result += f"- ID: {e.get('id')} | {e.get('title')} | {e.get('startTime')} | {e.get('location')}\n"
            return result
        else:
            return f"Lỗi tìm kiếm: {response.status_code}"
    except Exception as e:
        return f"Lỗi xử lý dữ liệu: {str(e)}"

@tool
def get_event_details(event_id: int):
    """
    Lấy thông tin chi tiết sự kiện: ticket types, sessions, giá vé. Tham số event_id phải là chuỗi hoặc số.
    """
    try:
        # Force event_id to string for API call
        eid = str(event_id)
        response = requests.get(f"{BACKEND_URL}/api/events/{eid}", timeout=10)
        if response.status_code != 200:
            return f"Lỗi lấy thông tin: {response.status_code}"
        
        event = response.json()
        result = f"Event: {event.get('title')}\n"
        result += f"Location: {event.get('location')}\n"
        result += f"Time: {event.get('startTime')} - {event.get('endTime')}\n\n"
        
        # Get ticket types
        tt_response = requests.get(f"{BACKEND_URL}/api/events/{eid}/ticket-types", timeout=10)
        if tt_response.status_code == 200:
            tt_data = tt_response.json()
            ticket_types = tt_data.get("data", []) if isinstance(tt_data, dict) else tt_data
            if ticket_types and isinstance(ticket_types, list):
                result += "Ticket Types:\n"
                for tt in ticket_types:
                    tt_id = tt.get('id')
                    result += f"- {tt.get('name')}: {tt.get('price')} VNĐ (còn {tt.get('availableQuantity', 'N/A')}) | ID: {tt_id} (EV{event_id}_TT{tt_id})\n"
        
        return result
    except Exception as e:
        return f"Lỗi xử lý chi tiết: {str(e)}"

@tool
def get_event_seats(event_id: int):
    """
    Lấy thông tin ghế và loại vé của sự kiện.
    - Nếu sự kiện có tọa độ (x,y): trả về danh sách ghế + tọa độ để user chọn ghế cụ thể.
    - Nếu sự kiện KHÔNG có tọa độ: trả về danh sách loại vé, KHÔNG yêu cầu chọn ghế.
    """
    try:
        eid = str(event_id)
        target_session = current_session_id_var.get()
        url = f"{BACKEND_URL}/api/events/{eid}/seats"
        if target_session:
            url += f"?sessionId={target_session}"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            seats = []
            if isinstance(data, list):
                seats = data
            elif isinstance(data, dict):
                seats = data.get("data", {}).get("seats", []) if isinstance(data.get("data"), dict) else data.get("data", [])
            
            if not isinstance(seats, list):
                return "Lỗi định dạng dữ liệu ghế."
                
            available = [s for s in seats if s.get("status") == "AVAILABLE"]
            if not available:
                return "Không còn ghế trống."
            
            has_coords = any(s.get("x") is not None and s.get("y") is not None for s in available)
            
            if has_coords:
                result = f"Sơ đồ ghế (tọa độ x,y):\n"
                for s in available[:30]:
                    sid = s.get('id')
                    result += f"- Ghế {s.get('seatNumber')} | ID: {sid} (EV{event_id}_SE{sid})\n"
                result += f"\nDùng các nút [SELECT: Ghế <tên> | EV{event_id}_SE<ID>] để user chọn ghế."
            else:
                result = "Sự kiện KHÔNG có sơ đồ ghế. Chỉ chọn loại vé dưới đây:\n"
                tt_response = requests.get(f"{BACKEND_URL}/api/events/{eid}/ticket-types", timeout=10)
                if tt_response.status_code == 200:
                    tt_data = tt_response.json()
                    ticket_types = tt_data.get("data", []) if isinstance(tt_data, dict) else tt_data
                    if ticket_types and isinstance(ticket_types, list):
                        for tt in ticket_types:
                            ttid = tt.get('id')
                            result += f"- {tt.get('name')}: {tt.get('price')} VNĐ | ID: {ttid} (EV{event_id}_TT{ttid})\n"
                        result += f"\nDùng các nút [SELECT: <tên loại vé> | EV<eventId>_TT<id>] để user chọn loại vé."
                else:
                    for s in available[:10]:
                        sid = s.get('id')
                        result += f"- Ghế: {s.get('seatNumber')} | ID: {sid} (EV{event_id}_SE{sid})\n"
            
            return result
        else:
            return f"Lỗi lấy ghế: {response.status_code}"
    except Exception as e:
        return f"Lỗi xử lý ghế: {str(e)}"

@tool
def create_order_api(event_id: int, seat_ids: List[int], total_amount: int):
    """
    Tạo đơn hàng và lấy link thanh toán. 
    - event_id: ID sự kiện.
    - seat_ids: Danh sách ID ghế.
    - total_amount: Tổng tiền (VNĐ).
    """
    global current_session_token
    try:
        target_session = current_session_id_var.get()

        token = current_session_token
        if not token:
            session_data = user_sessions.get(target_session, {})
            token = session_data.get("access_token")
        
        if not token:
            return f"Chưa đăng nhập! (Session: {target_session}). Vui lòng yêu cầu người dùng đăng nhập trên website."
        
        user_id = user_sessions.get(target_session, {}).get("user_id")
        if not user_id:
            return "Không tìm thấy user ID. Vui lòng đăng nhập lại."
        
        seat_id_list = seat_ids if isinstance(seat_ids, list) else [seat_ids]
        if not seat_id_list:
            return "Lỗi: Danh sách ghế không được trống."

        # Resolve ticket_type_ids to seat_ids if necessary
        resolved_seat_ids = []
        try:
            with db_safe.engine.connect() as conn:
                for sid in seat_id_list:
                    # Check if it exists in seats
                    seat_check = conn.execute(text("SELECT id FROM seats WHERE id = :sid"), {"sid": sid}).fetchone()
                    if seat_check:
                        resolved_seat_ids.append(sid)
                    else:
                        # Check if it's a ticket_type_id
                        tt_check = conn.execute(text("SELECT id FROM ticket_types WHERE id = :sid"), {"sid": sid}).fetchone()
                        if tt_check:
                            # It is a ticket type ID! Find an available seat
                            # Exclude seats already added to resolved_seat_ids to avoid duplicates
                            exclude_ids = resolved_seat_ids if resolved_seat_ids else [-1]
                            placeholders = ", ".join(str(x) for x in exclude_ids)
                            query = text(f"""
                                SELECT id FROM seats 
                                WHERE ticket_type_id = :tt_id 
                                  AND status = 'AVAILABLE' 
                                  AND id NOT IN ({placeholders})
                                ORDER BY id ASC LIMIT 1
                            """)
                            avail_seat = conn.execute(query, {"tt_id": sid}).fetchone()
                            if avail_seat:
                                resolved_seat_ids.append(avail_seat[0])
                            else:
                                return f"Lỗi: Hết vé cho loại vé ID {sid}."
                        else:
                            return f"Lỗi: ID {sid} không phải là ID ghế hoặc ID loại vé hợp lệ."
        except Exception as db_err:
            return f"Lỗi truy vấn cơ sở dữ liệu: {str(db_err)}"

        order_data = {
            "amount": total_amount,
            "orderInfo": f"Thanh toán vé sự kiện {event_id}",
            "userId": user_id,
            "seatIds": resolved_seat_ids,
            "paymentMethod": "vnpay" 
        }
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BACKEND_URL}/api/payment/create",
            json=order_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            payment_url = data.get("url")
            # The URL usually contains txnRef or we can parse it
            import urllib.parse
            parsed_url = urllib.parse.urlparse(payment_url)
            params = urllib.parse.parse_qs(parsed_url.query)
            order_id = params.get("txnRef", [None])[0]
            
            return f"Đơn hàng đã được tạo thành công! (ID Đơn hàng: {order_id})\nLink thanh toán gốc: {payment_url}"
        else:
            return f"Lỗi tạo đơn: {response.status_code} - {response.text}"
    except Exception as e:
        return f"Lỗi: {str(e)}"

@tool
def check_order_status(order_id: int):
    """
    Kiểm tra trạng thái thanh toán của đơn hàng từ database.
    """
    try:
        query = f"SELECT status, total_amount FROM orders WHERE id = {order_id}"
        # Reuse query_database logic but inside here for simplicity or just call it
        from sqlalchemy import text
        with engine.connect() as connection:
            result = connection.execute(text(query))
            row = result.fetchone()
            if row:
                status = row[0]
                amount = row[1]
                if status == "COMPLETED":
                    return f"✅ Đơn hàng {order_id} đã được thanh toán thành công (Số tiền: {amount} VNĐ)."
                else:
                    return f"⏳ Đơn hàng {order_id} đang ở trạng thái: {status}. Vui lòng hoàn tất thanh toán."
            else:
                return f"❌ Không tìm thấy đơn hàng có ID {order_id}."
    except Exception as e:
        return f"Lỗi kiểm tra đơn hàng: {str(e)}"

@tool
def auto_pay_order(order_id: int):
    """
    Tự động thực hiện thanh toán cho đơn hàng (Auto-pay). 
    Sử dụng cơ chế Mock Sandbox để xác nhận thanh toán ngay lập tức.
    """
    try:
        # Call the vnpay-return endpoint with mock hash
        params = {
            "vnp_TxnRef": str(order_id),
            "vnp_TransactionResponseCode": "00",
            "vnp_SecureHash": "MOCK_SANDBOX_HASH"
        }
        response = requests.get(f"{BACKEND_URL}/api/public/payment/vnpay-return", params=params, timeout=10)
        
        if response.status_code in [200, 302]: # Redirect is expected
            return f"✅ Đã thực hiện thanh toán tự động thành công cho đơn hàng {order_id}! Hệ thống đã xác nhận và gửi vé qua email cho bạn."
        else:
            return f"Lỗi khi thực hiện auto-pay: {response.status_code}"
    except Exception as e:
        return f"Lỗi hệ thống khi thanh toán: {str(e)}"

tools = [query_database, search_events_semantic, search_events_api, get_event_details, get_event_seats, create_order_api, check_order_status, auto_pay_order]

# Agent Memory - simple list-based history
from langchain_core.messages import HumanMessage, AIMessage

store = {}

def get_session_history(session_id: str, user_id: str = None):
    # If user_id is provided, try to load from database
    if user_id:
        try:
            with db_safe.engine.connect() as conn:
                # Get last 15 messages for this user
                query = text("SELECT role, message FROM chat_history WHERE account_id = :uid ORDER BY timestamp ASC LIMIT 30")
                result = conn.execute(query, {"uid": user_id})
                db_history = []
                for row in result:
                    if row.role == 'user':
                        db_history.append(HumanMessage(content=row.message))
                    else:
                        db_history.append(AIMessage(content=row.message))
                
                if db_history:
                    return db_history
        except Exception as e:
            logger.error(f"Error loading history from DB: {e}")

    if session_id not in store:
        store[session_id] = []
    return store[session_id]

def save_message_to_db(user_id: str, role: str, message: str):
    if not user_id:
        return
    try:
        with db_safe.engine.connect() as conn:
            query = text("INSERT INTO chat_history (account_id, role, message, timestamp) VALUES (:uid, :role, :msg, :ts)")
            conn.execute(query, {"uid": user_id, "role": role, "msg": message, "ts": datetime.now()})
            conn.commit()
    except Exception as e:
        logger.error(f"Error saving message to DB: {e}")

from google import genai

@app.get("/list-models")
async def list_models():
    """Chỉ liệt kê các model hỗ trợ Embedding."""
    try:
        client = genai.Client(api_key=GOOGLE_API_KEY)
        models = []
        for m in client.models.list():
            models.append({
                "name": m.name,
                "supported_actions": m.supported_actions,
                "description": m.description
            })
        return {"models_available": models}
    except Exception as e:
        return {"error": str(e)}

@app.get("/inspect-db")
async def inspect_db():
    """Kiểm tra Qdrant vector store."""
    try:
        client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        collections = client.get_collections()
        return {"message": "Using Qdrant vector database.", "collection": QDRANT_COLLECTION, "collections": [c.name for c in collections.collections]}
    except Exception as e:
        return {"error": str(e)}

# Global vectorstore reference
vectorstore = None

def get_vectorstore():
    global vectorstore
    if vectorstore is None:
        qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        # Create collection if it doesn't exist
        try:
            collections = qdrant_client.get_collections()
            exists = any(c.name == QDRANT_COLLECTION for c in collections.collections)
            if not exists:
                qdrant_client.create_collection(
                    collection_name=QDRANT_COLLECTION,
                    vectors_config=VectorParams(size=3072, distance=Distance.COSINE)
                )
        except Exception:
            pass  # Collection might already exist
        vectorstore = QdrantVectorStore(
            client=qdrant_client,
            collection_name=QDRANT_COLLECTION,
            embedding=embeddings,
        )
    return vectorstore

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default_session"
    token: Optional[str] = None
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    intermediate_steps: List[str] = []
    history: Optional[List[dict]] = None

@app.get("/chat-history/{user_id}")
async def get_history(user_id: str):
    try:
        with db_safe.engine.connect() as conn:
            query = text("SELECT role, message FROM chat_history WHERE account_id = :uid ORDER BY timestamp ASC LIMIT 50")
            result = conn.execute(query, {"uid": user_id})
            history = [{"role": row.role, "content": row.message} for row in result]
            return {"history": history}
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        return {"history": []}

@app.get("/")
def read_root():
    return {"status": "AI Assistant is running"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session_id = request.session_id
    current_session_id_var.set(session_id)
    
    # Auto-login if token provided from frontend
    if request.token and request.user_id:
        user_sessions[session_id] = {
            "access_token": request.token,
            "user_id": request.user_id
        }
        logger.info(f"Session {session_id} auto-authenticated with token.")

    # System prompt cho Agent với thông tin thời gian thực
    current_date = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    prompt = ChatPromptTemplate.from_messages([
        ("system", f"""Bạn là trợ lý ảo AI Agent chuyên nghiệp của EventPlatform. 
Hôm nay là ngày: {current_date}.

Bạn có quyền truy cập vào Database SQL, Vector Store và API để trả lời câu hỏi.

🎫 QUY TẮC CHỌN TOOL (QUAN TRỌNG):
1. **LUÔN LUÔN** dùng `query_database` khi người dùng hỏi về thời gian cụ thể (ví dụ: "tháng 5", "cuối tuần này", "ngày 20/5"), địa điểm cụ thể hoặc cần con số chính xác. Hãy tự viết câu lệnh SQL SELECT phù hợp.
2. Dùng `search_events_semantic` khi người dùng hỏi chung chung, cần tư vấn theo cảm xúc hoặc mô tả sự kiện (ví dụ: "sự kiện nào vui nhộn", "có show diễn nào cho trẻ em không").

🎨 QUY TẮC TRÌNH BÀY (PREMIUM MOBILE-FIRST UI):
- **KHÔNG DÙNG BÔI ĐẬM (**)**. Thay vào đó hãy dùng `inline code` (dấu `) để highlight thông tin quan trọng.
- **KHÔNG DÙNG BẢNG (TABLE)**. Hãy dùng định dạng **Card (Thẻ)** như sau:
  ---
  🎭 `Tên Sự Kiện Highlight`
  📅 {current_date}
  📍 Địa điểm ngắn gọn
  [INFO: Xem chi tiết | ID] [BOOK: Đặt vé | ID]
  ---
- Sử dụng cú pháp nút bấm đặc biệt (KHÔNG bọc trong backtick ``):
  - [INFO: Tên nút | ID] -> Nút xem chi tiết
  - [BOOK: Tên nút | ID] -> Nút đặt vé
  - [SELECT: Tên nút | EV<eventId>_TT<ticketTypeId>] hoặc [SELECT: Tên nút | EV<eventId>_SE<seatId>] -> Nút chọn

  ⚠️ QUAN TRỌNG: Xuống dòng RIÊNG cho mỗi nút, KHÔNG đặt trong backtick, KHÔNG thêm `` quanh cú pháp.
- Trình bày cực kỳ tinh gọn, tránh viết đoạn văn dài.
- 🚨 TUYỆT ĐỐI KHÔNG tự tạo/bịa danh sách ghế. Chỉ hiển thị ghế/danh sách có được từ kết quả tool `get_event_seats`.

🎫 QUY TRÌNH ĐẶT VÉ TỰ ĐỘNG:
1. Gọi `get_event_details` để xem thông tin + loại vé.
2. Gọi `get_event_seats` để kiểm tra loại sơ đồ:
   - Nếu CÓ tọa độ (x,y): hiển thị danh sách ghế từ kết quả, dùng nút [SELECT: Ghế <tên> | EV<eventId>_SE<seatId>] mỗi ghế một dòng.
   - Nếu KHÔNG có x,y: KHÔNG hiển thị ghế. Chỉ hiển thị loại vé, dùng nút [SELECT: <tên loại vé> | EV<eventId>_TT<ticketTypeId>] mỗi loại một dòng.
3. SAU KHI user chọn loại vé (click EV_TT button): LUÔN gọi lại `get_event_seats(event_id)` để lấy thông tin cập nhật. Nếu ko có x,y thì proceed luôn (ko hỏi ghế).
4. Tạo đơn -> Tự động thanh toán (gọi `auto_pay_order`).

QUY TẮC KHÁC:
1. Trình bày bằng Markdown chuyên nghiệp, dùng `inline code` để highlight thông tin, dùng icon (📅, 📍, 🎟️, ⭐).
2. Nếu khách hàng chưa đăng nhập, hãy yêu cầu họ Đăng nhập. Kèm theo nút [SELECT: Tôi đã đăng nhập | check_auth] trên một dòng riêng (không backtick).
3. Nếu khách hỏi về giá vé hoặc chỗ ngồi, LUÔN gọi `get_event_details` trước để xem loại vé, sau đó gọi `get_event_seats`.
4. Khi khách tìm sự kiện theo tên ca sĩ/nghệ sĩ, KHÔNG dùng `search_events_semantic` — thay vào đó dùng `query_database` với SQL JOIN: `SELECT e.* FROM events e JOIN event_artists ea ON e.id=ea.event_id JOIN artists a ON ea.artist_id=a.id WHERE a.name ILIKE '%tên_ca_sĩ%'`.
5. Khi khách hỏi "có sự kiện nào ở [địa điểm]" — tìm events với `ILIKE '%địa điểm%'` và `start_time > NOW()` (sự kiện sắp diễn ra). KHÔNG thêm điều kiện `start_time <= NOW() AND end_time >= NOW()` trừ khi khách hỏi "đang diễn ra". Nếu tìm thấy thì HIỂN THỊ NGAY cho khách, không tự ý query lại với điều kiện khác.

DATABASE SCHEMA:
- Bảng `events`: id, title, location, start_time, end_time, status (pending|sold_out|ended|upcoming|rejected), tickets_left.
- Bảng `seats`: id, row, seat_number, status (AVAILABLE|PENDING|BOOKED), ticket_type_id.
- Bảng `artists`: id, name, bio, image.
- Bảng `event_artists`: event_id, artist_id (liên kết nhiều-nhiều events <-> artists).
"""),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    def try_invoke(model, message, history, session_id):
        agent = create_tool_calling_agent(model, tools, prompt)
        executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
        return executor.invoke({
            "input": message,
            "history": history[-1:], # Chỉ lấy tin nhắn trước đó
            "session_id": session_id,
        })

    def invoke_with_failover(message, history, session_id):
        global groq_key_index
        errors = []
        num_keys = len(groq_clients)
        for attempt in range(num_keys):
            idx = (groq_key_index + attempt) % num_keys
            api_key, llm_instance = groq_clients[idx]
            try:
                result = try_invoke(llm_instance, message, history, session_id)
                groq_key_index = idx
                return result
            except Exception as e:
                err_msg = str(e)
                errors.append(f"Key {idx}: {err_msg[:200]}")
                if "429" in err_msg or "rate_limit" in err_msg.lower():
                    logger.warning(f"⚠️ Groq key {idx} rate limited, trying next...")
                    continue
                if "Failed to call a function" in err_msg:
                    logger.warning(f"⚠️ Groq model lỗi tool call, thử lại key khác...")
                    continue
                logger.error(f"❌ Groq key {idx} lỗi: {err_msg}", exc_info=True)
                raise
        # All keys exhausted
        logger.error(f"❌ Tất cả attempts thất bại: {'; '.join(errors)}")
        return {"output": "⚠️ Hệ thống AI tạm thời quá tải. Vui lòng thử lại sau ít phút."}

    session_id = request.session_id
    user_id = request.user_id
    
    # Ưu tiên lấy lịch sử từ DB nếu có user_id
    history = get_session_history(session_id, user_id)

    try:
        response = invoke_with_failover(request.message, history, session_id)
    except Exception as e:
        err_msg = str(e)
        logger.error(f"❌ Groq lỗi: {err_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI Service unavailable: {err_msg}")

    try:
        
        # Trích xuất văn bản từ kết quả (Xử lý cả dict blocks và raw strings)
        answer = response["output"]
        if isinstance(answer, list):
            parts = []
            for block in answer:
                if isinstance(block, dict):
                    parts.append(block.get("text", ""))
                elif isinstance(block, str):
                    parts.append(block)
            answer = "".join(parts)
        
        # Lưu vào lịch sử hội thoại (In-memory)
        history.append(HumanMessage(content=request.message))
        history.append(AIMessage(content=str(answer)))
        
        # Lưu vào Database nếu đã đăng nhập
        if user_id:
            save_message_to_db(user_id, 'user', request.message)
            save_message_to_db(user_id, 'ai', str(answer))
        
        return ChatResponse(answer=str(answer))
    except Exception as e:
        logging.error(f"Error in /chat Agent: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sync-db")
async def sync_database():
    try:
        # Fetch all events from backend API
        response = requests.get(f"{BACKEND_URL}/api/events/search?size=100", timeout=15)
        if response.status_code != 200:
            return {"error": f"Failed to fetch events: {response.status_code}"}
        
        data = response.json()
        events = data.get("data", []) if isinstance(data, dict) else data
        
        if not events:
            return {"message": "No events found."}

        documents = []
        for event in events:
            content = (
                f"Sự kiện: {event.get('title', 'N/A')}\n"
                f"Thể loại: {event.get('categoryName', 'N/A')}\n"
                f"Nghệ sĩ: {event.get('artists', 'N/A')}\n"
                f"Mô tả: {event.get('description', 'N/A')}\n"
                f"Địa điểm: {event.get('location', 'N/A')}\n"
                f"Thời gian bắt đầu: {event.get('startTime', 'N/A')}"
            )
            documents.append(Document(page_content=content, metadata={"source": f"event-{event.get('id')}"}))

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        texts = text_splitter.split_documents(documents)

        # Clear collection and add new documents
        vs = get_vectorstore()
        try:
            qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
            qdrant_client.recreate_collection(
                collection_name=QDRANT_COLLECTION,
                vectors_config=VectorParams(size=3072, distance=Distance.COSINE)
            )
        except Exception as e:
            logger.warning(f"Failed to recreate collection: {e}")
            
        vs.add_documents(texts)
        
        return {"message": f"Successfully synced {len(events)} events to Qdrant."}
    except Exception as e:
        logger.error(f"Error in /sync-db: {traceback.format_exc()}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
