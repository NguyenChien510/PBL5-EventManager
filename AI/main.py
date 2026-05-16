import os
import logging
import traceback
import psycopg2
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor

# Updated LangChain Imports for v0.3+
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_postgres.vectorstores import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_classic.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_classic.schema import Document
from langchain_classic.tools import tool
from langchain_classic.agents import AgentExecutor, create_tool_calling_agent
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
    docs = vs.similarity_search(query, k=5)
    return "\n---\n".join([d.page_content for d in docs])

tools = [query_database, search_events_semantic]

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
    """Kiểm tra DB đã chuyển sang Supabase."""
    return {"message": "Using Supabase vector database.", "collection_name": COLLECTION_NAME}

# Global vectorstore reference
vectorstore = None

def get_vectorstore():
    global vectorstore
    if vectorstore is None:
        CONNECTION_STRING = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        vectorstore = PGVector(
            collection_name=COLLECTION_NAME,
            connection=CONNECTION_STRING,
            embeddings=embeddings,
            use_jsonb=True,
        )
    return vectorstore

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default_session"

class ChatResponse(BaseModel):
    answer: str
    intermediate_steps: List[str] = []

@app.get("/")
def read_root():
    return {"status": "AI Assistant is running"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # System prompt for Agent với thông tin thời gian thực
    current_date = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    prompt = ChatPromptTemplate.from_messages([
        ("system", f"""Bạn là trợ lý ảo AI Agent chuyên nghiệp của EventPlatform. 
Hôm nay là ngày: {current_date}.

Bạn có quyền truy cập vào Database SQL và Vector Store để trả lời câu hỏi.

QUY TẮC:
1. Luôn ưu tiên dùng `query_database` nếu câu hỏi cần số liệu chính xác. Mặc định dùng năm hiện tại ({datetime.now().year}) nếu không có yêu cầu khác.
2. Dùng `search_events_semantic` khi cần tư vấn, tìm kiếm theo cảm xúc hoặc mô tả chung chung.
3. Trình bày bằng Markdown chuyên nghiệp, dùng icon (📅, 📍, 🎟️, ⭐) và bôi đậm tên sự kiện.
4. Tuyệt đối KHÔNG thực hiện lệnh INSERT, UPDATE, DELETE. Từ chối lịch sự nếu được yêu cầu.

DATABASE SCHEMA:
- Bảng `events`: id, title, description, location, start_time, end_time, status, tickets_left, rating.
- Bảng `ticket_types`: id, name (tên hạng vé), price (giá tiền), total_quantity, event_session_id.
- Bảng `event_sessions`: id, event_id, session_date, start_time, end_time. (Kết nối `events` và `ticket_types`)
- Bảng `categories`: id, name. (Kết nối qua `events.category_id`)
- Bảng `artists`: id, name. (Kết nối qua bảng trung gian `event_artists`)
- Bảng `comments`: content, rating, event_id. (Dùng để xem đánh giá của người dùng)
"""),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    def try_invoke(model, message, history):
        agent = create_tool_calling_agent(model, tools, prompt)
        executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
        return executor.invoke({
            "input": message,
            "history": history,
        })

    history = get_session_history(request.session_id)

    try:
        response = try_invoke(llm_groq, request.message, history)
    except Exception as groq_err:
        logger.warning(f"⚠️ Groq gặp lỗi: {str(groq_err)}. Đang chuyển sang Gemini dự phòng...")
        try:
            response = try_invoke(llm_gemini, request.message, history)
        except Exception as gemini_err:
            logger.error(f"❌ Cả Groq và Gemini đều thất bại. Lỗi Gemini: {str(gemini_err)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"AI Services unavailable. Groq: {str(groq_err)} | Gemini: {str(gemini_err)}")

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
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASSWORD
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = "SELECT id, title, description, location, start_time, category, artists FROM events"
        cur.execute(query)
        rows = cur.fetchall()
        
        if not rows:
            return {"message": "No events found in database."}

        documents = []
        for row in rows:
            content = (
                f"Sự kiện: {row['title']}\n"
                f"Thể loại: {row['category']}\n"
                f"Nghệ sĩ: {row['artists']}\n"
                f"Mô tả: {row['description']}\n"
                f"Địa điểm: {row['location']}\n"
                f"Thời gian bắt đầu: {row['start_time']}"
            )
            documents.append(Document(page_content=content, metadata={"source": f"db-event-{row['id']}"}))

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        texts = text_splitter.split_documents(documents)

        vs = get_vectorstore()
        vs.add_documents(texts)
        
        cur.close()
        conn.close()
        
        return {"message": f"Successfully synced {len(rows)} events."}
    except Exception as e:
        logger.error(f"Error in /sync-db: {traceback.format_exc()}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
