import os
import sys
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv(dotenv_path="d:\\EventManager\\AI\\.env")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

for model_name in ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"]:
    try:
        print(f"Testing model: {model_name}")
        llm = ChatGoogleGenerativeAI(model=model_name, google_api_key=GOOGLE_API_KEY)
        res = llm.invoke("Hi")
        print(f"✅ Success with {model_name}: {res.content}")
        break
    except Exception as e:
        print(f"❌ Failed with {model_name}: {e}\n")
