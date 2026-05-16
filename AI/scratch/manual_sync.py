import os
import sys
from sqlalchemy import create_engine, text
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from langchain_classic.schema import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from dotenv import load_dotenv

# Ensure UTF-8 output
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

load_dotenv('d:/EventManager/AI/.env')

# DB Config
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

# Qdrant Config
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION")

# Google API Key
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

print("--- Starting Manual Sync (DB -> Qdrant) ---")

# 1. Fetch from DB
db_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(db_url)

documents = []
try:
    with engine.connect() as conn:
        # Join with categories to get more info
        query = text("""
            SELECT e.id, e.title, e.description, e.location, e.start_time, c.name as category_name 
            FROM events e
            LEFT JOIN categories c ON e.category_id = c.id
        """)
        result = conn.execute(query)
        for row in result:
            event = dict(row._mapping)
            content = (
                f"Sự kiện: {event.get('title', 'N/A')}\n"
                f"Thể loại: {event.get('category_name', 'N/A')}\n"
                f"Mô tả: {event.get('description', 'N/A')}\n"
                f"Địa điểm: {event.get('location', 'N/A')}\n"
                f"Thời gian: {event.get('start_time', 'N/A')}"
            )
            documents.append(Document(page_content=content, metadata={"id": str(event.get('id')), "source": "db_sync"}))
    
    print(f"Fetched {len(documents)} events from DB.")
except Exception as e:
    print(f"Error fetching from DB: {e}")
    sys.exit(1)

if not documents:
    print("No events to sync.")
    sys.exit(0)

# 2. Process documents
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
texts = text_splitter.split_documents(documents)

# 3. Update Qdrant
try:
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    
    # Recreate collection to clear old data
    print(f"Recreating collection '{QDRANT_COLLECTION}'...")
    client.recreate_collection(
        collection_name=QDRANT_COLLECTION,
        vectors_config=VectorParams(size=3072, distance=Distance.COSINE)
    )
    
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2", google_api_key=GOOGLE_API_KEY)
    
    vs = QdrantVectorStore(
        client=client,
        collection_name=QDRANT_COLLECTION,
        embedding=embeddings,
    )
    
    vs.add_documents(texts)
    print(f"Successfully synced {len(documents)} events ({len(texts)} chunks) to Qdrant.")
except Exception as e:
    print(f"Error updating Qdrant: {e}")
