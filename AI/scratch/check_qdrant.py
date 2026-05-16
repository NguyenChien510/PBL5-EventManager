import os
from qdrant_client import QdrantClient
from dotenv import load_dotenv

load_dotenv('d:/EventManager/AI/.env')

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION")

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

try:
    print(f"Checking Qdrant Collection: {QDRANT_COLLECTION}")
    collection_info = client.get_collection(QDRANT_COLLECTION)
    print(f"Points count: {collection_info.points_count}")
    
    # Try to peek at some points
    points = client.scroll(
        collection_name=QDRANT_COLLECTION,
        limit=5,
        with_payload=True
    )[0]
    
    print("\n--- Top 5 Points in Qdrant ---")
    for p in points:
        print(f"ID: {p.id} | Payload: {p.payload.get('page_content')[:200]}...")
except Exception as e:
    print(f"Error: {e}")
