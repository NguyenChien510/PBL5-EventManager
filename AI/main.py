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

from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_qdrant import QdrantVectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_classic.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_classic.schema import Document
from langchain_classic.tools import tool
from langchain_classic.agents import AgentExecutor, create_tool_calling_agent
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
# Model dự phòng (Gemini) - Dùng khi Groq lỗi
llm_gemini = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0, google_api_key=GOOGLE_API_KEY, max_retries=0)
# Model chính (Groq) - Dùng model OpenAI-compatible để tool calling ổn định
llm_groq = ChatGroq(model="openai/gpt-oss-120b", temperature=0, groq_api_key=GROQ_API_KEY)

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
def login_user(email: str, password: str, session_id: str = "current"):
    """
    Đăng nhập người dùng để đặt vé. session_id mặc định là "current" cho phiên đặt vé hiện tại.
    """
    global current_session_token
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/auth/signin",
            json={"email": email, "password": password},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            token = data.get("accessToken")
            user_id = data.get("user", {}).get("id")
            user_sessions[session_id] = {
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
def get_event_details(event_id: str):
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
                    result += f"- {tt.get('name')}: {tt.get('price')} VNĐ (còn {tt.get('availableQuantity', 'N/A')})\n"
        
        return result
    except Exception as e:
        return f"Lỗi xử lý chi tiết: {str(e)}"

@tool
def get_event_seats(event_id: str, session_id: str = None):
    """
    Lấy danh sách ghế ngồi của sự kiện. Trả về seat map với các ghế đang trống. event_id phải là chuỗi hoặc số.
    """
    try:
        eid = str(event_id)
        target_session = session_id
        if target_session in ["current", "default", None]:
            target_session = current_session_id_var.get()
            
        url = f"{BACKEND_URL}/api/events/{eid}/seats"
        if target_session:
            url += f"?sessionId={target_session}"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            # Handle both wrapped and unwrapped lists
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
            
            # Kiểm tra xem có tọa độ x, y không
            has_coords = any(s.get("x") is not None and s.get("y") is not None for s in available)
            
            result = f"Sự kiện này {'CÓ' if has_coords else 'KHÔNG CÓ'} sơ đồ tọa độ (x,y).\n"
            result += f"Có {len(available)} ghế trống:\n"
            
            if has_coords:
                result += "Hệ thống hỗ trợ chọn ghế trực quan qua tọa độ.\n"
                for s in available[:20]:
                    result += f"- Ghế {s.get('seatNumber')} (Row {s.get('row', 'N/A')}) | Tọa độ: ({s.get('x')}, {s.get('y')}) | ID: {s.get('id')}\n"
            else:
                result += "Sự kiện chỉ bán theo loại vé (không có sơ đồ ghế cụ thể).\n"
                # Group by ticket type if possible or just list
                for s in available[:15]:
                    result += f"- Ghế {s.get('seatNumber')} | ID: {s.get('id')}\n"
            
            return result
        else:
            return f"Lỗi lấy ghế: {response.status_code}"
    except Exception as e:
        return f"Lỗi xử lý ghế: {str(e)}"

@tool
def create_order_api(event_id: str, seat_ids: List[int], total_amount: int, session_id: str = "current"):
    """
    Tạo đơn hàng và lấy link thanh toán. 
    - event_id: ID sự kiện.
    - seat_ids: Danh sách ID ghế.
    - total_amount: Tổng tiền (VNĐ).
    - session_id: Mặc định "current".
    """
    global current_session_token
    try:
        # Fallback to context variable if session_id is default or None
        target_session = session_id
        if target_session in ["current", "default", None]:
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
        
        order_data = {
            "amount": total_amount,
            "orderInfo": f"Thanh toán vé sự kiện {event_id}",
            "userId": user_id,
            "seatIds": seat_id_list,
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

def get_session_history(session_id: str):
    if session_id not in store:
        store[session_id] = []
    return store[session_id]

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

🎨 QUY TẮC TRÌNH BÀY (PREMIUM UI):
- Sử dụng Bảng (Table) Markdown để liệt kê danh sách sự kiện.
- Cấu trúc bảng: | STT | Sự Kiện | Thời Gian | Địa Điểm | Trạng Thái |
- Sử dụng các emoji phù hợp (📅, 🎭, 🎶, 📍, 🎟️).
- Sau khi liệt kê, hãy cung cấp các gợi ý hành động như:
  - `[Xem chi tiết ID: {id}]`
  - `[Đặt vé ngay ID: {id}]`

🎫 QUY TRÌNH ĐẶT VÉ TỰ ĐỘNG (Dành cho người dùng đã đăng nhập):
1. Tìm sự kiện (Ưu tiên dùng `query_database` cho các câu hỏi về thời gian/địa điểm)
2. Xem chi tiết + ghế (get_event_details, get_event_seats)
3. **Xử lý linh hoạt theo loại ghế**:
   - **Nếu sự kiện CÓ tọa độ (x,y)**: Hãy giới thiệu sơ đồ ghế và đề xuất người dùng chọn vị trí đẹp (ví dụ: "Bạn có muốn chọn ghế ở hàng đầu không?").
   - **Nếu sự kiện KHÔNG CÓ tọa độ**: Chỉ liệt kê danh sách các loại vé hiện có và hỏi người dùng muốn mua loại vé nào.
4. Hỏi user chọn ghế (seat IDs)
5. Tạo đơn (create_order_api)
6. **QUAN TRỌNG**: Sau khi tạo đơn xong, hãy TỰ ĐỘNG gọi `auto_pay_order` để hoàn tất thanh toán ngay lập tức cho khách hàng. KHÔNG cần hỏi lại user "có muốn thanh toán không".

QUY TẮC KHÁC:
1. Trình bày bằng Markdown chuyên nghiệp, bôi đậm tên sự kiện quan trọng, dùng icon (📅, 📍, 🎟️, ⭐).
2. Nếu khách hàng chưa đăng nhập (thiếu token/session), hãy lịch sự yêu cầu họ Đăng nhập trên trang web trước khi đặt vé. Bạn KHÔNG hỏi mật khẩu của họ nữa.
3. Khi đặt vé thành công, hãy chúc mừng và gửi thông tin mã đơn hàng.

DATABASE SCHEMA:
- Bảng `events`: id, title, location, start_time, end_time, status, tickets_left.
- Bảng `seats`: id, row, seat_number, status (AVAILABLE/OCCUPIED), ticket_type_id.
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
            "history": history,
            "session_id": session_id,
        })

    session_id = request.session_id
    history = get_session_history(session_id)

    try:
        response = try_invoke(llm_groq, request.message, history, session_id)
    except Exception as groq_err:
        err_msg = str(groq_err)
        if "429" in err_msg or "rate_limit" in err_msg.lower():
            logger.warning("⚠️ Groq bị giới hạn tốc độ (429). Thử Gemini...")
        else:
            logger.warning(f"⚠️ Groq gặp lỗi: {err_msg}. Đang chuyển sang Gemini dự phòng...")
            
        try:
            response = try_invoke(llm_gemini, request.message, history, session_id)
        except Exception as gemini_err:
            gem_msg = str(gemini_err)
            logger.error(f"❌ Cả Groq và Gemini đều thất bại. Lỗi Gemini: {gem_msg}", exc_info=True)
            
            if "429" in gem_msg or "RESOURCE_EXHAUSTED" in gem_msg:
                return ChatResponse(answer="⚠️ Hiện tại cả hai hệ thống AI (Groq & Gemini) đều đang quá tải (Rate Limit). Vui lòng đợi khoảng 30 giây rồi thử lại. Xin lỗi bạn vì sự bất tiện này! 🙏")
            
            raise HTTPException(status_code=500, detail=f"AI Services unavailable. Groq: {err_msg} | Gemini: {gem_msg}")

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
        
        # Lưu vào lịch sử hội thoại
        history.append(HumanMessage(content=request.message))
        history.append(AIMessage(content=str(answer)))
        
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
