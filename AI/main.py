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
from langchain_postgres.vectorstores import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document

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

# Initialize components
EMBEDDING_MODEL = "models/gemini-embedding-001" 
embeddings = GoogleGenerativeAIEmbeddings(model=EMBEDDING_MODEL, google_api_key=GOOGLE_API_KEY)
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0, google_api_key=GOOGLE_API_KEY)

from google import genai

@app.get("/list-models")
async def list_models():
    """Chỉ liệt kê các model hỗ trợ Embedding."""
    try:
        client = genai.Client(api_key=GOOGLE_API_KEY)
        models = []
        for m in client.models.list():
            # Lọc các model có hỗ trợ embedContent
            if "embedContent" in m.supported_actions:
                models.append({
                    "name": m.name,
                    "description": m.description
                })
        return {"embedding_models_available": models}
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

class ChatResponse(BaseModel):
    answer: str
    sources: List[str] = []

@app.get("/")
def read_root():
    return {"status": "AI Assistant is running"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    vs = get_vectorstore()
    retriever = vs.as_retriever(search_kwargs={"k": 5})

    # System instruction
    template = """Bạn là trợ lý ảo thông minh của EventPlatform. 
Hãy trả lời câu hỏi một cách chuyên nghiệp, thân thiện và trình bày thật đẹp mắt.

QUY TẮC TRÌNH BÀY:
1. Sử dụng danh sách có dấu gạch đầu dòng (-) hoặc số thứ tự khi liệt kê nhiều sự kiện.
2. Bôi đậm **Tên sự kiện** và **Thời gian**.
3. Sử dụng các icon (📅, 📍, 🎤, 🏷️) để phân tách các thông tin:
   - 📅 Ngày giờ
   - 📍 Địa điểm
   - 🎤 Nghệ sĩ
   - 🏷️ Thể loại
4. Nếu không có thông tin, hãy xin lỗi lịch sự.

Danh sách TẤT CẢ sự kiện trong hệ thống (Dùng để trả lời các câu hỏi thống kê số lượng, đếm tháng, liệt kê tổng quan):
{all_events_summary}

Thông tin chi tiết tìm thấy cho câu hỏi (Dùng để trả lời chi tiết về 1 sự kiện cụ thể):
{context}

Câu hỏi của người dùng: {question}

Câu trả lời của trợ lý:"""
    
    prompt = ChatPromptTemplate.from_template(template)

    # Lấy tổng hợp tất cả sự kiện từ Database để AI có bức tranh toàn cảnh
    try:
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASSWORD
        )
        cur = conn.cursor()
        cur.execute("SELECT title, start_time FROM events")
        rows = cur.fetchall()
        all_events_summary_str = "\n".join([f"- Tên: {r[0]} | Thời gian: {r[1]}" for r in rows])
        if not all_events_summary_str:
            all_events_summary_str = "Hiện chưa có sự kiện nào trong cơ sở dữ liệu."
        cur.close()
        conn.close()
    except Exception as e:
        logger.error(f"Error fetching all events summary: {e}")
        all_events_summary_str = "Không thể lấy danh sách tổng hợp sự kiện."

    # Building the chain (LCEL)
    chain = (
        {"context": retriever, "question": RunnablePassthrough(), "all_events_summary": lambda x: all_events_summary_str}
        | prompt
        | llm
        | StrOutputParser()
    )

    try:
        # We need the source docs too for metadata, so we call retriever separately
        docs = retriever.invoke(request.message)
        context_str = "\n".join([doc.page_content for doc in docs])
        
        answer = chain.invoke(request.message)
        sources = [doc.metadata.get("source", "Unknown") for doc in docs]
        
        return ChatResponse(answer=answer, sources=list(set(sources)))
    except Exception as e:
        logger.error(f"Error in /chat: {traceback.format_exc()}")
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
