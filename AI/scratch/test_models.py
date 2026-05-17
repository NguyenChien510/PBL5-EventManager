import os
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv(dotenv_path="d:\\EventManager\\AI\\.env")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

print("--- Testing specific models ---")
for model_name in ["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-flash-latest"]:
    print(f"Testing {model_name}...")
    try:
        llm = ChatGoogleGenerativeAI(model=model_name, temperature=0, google_api_key=GOOGLE_API_KEY, max_retries=0)
        res = llm.invoke("Hi! Reply with one word.")
        print(f"Success! {model_name} responded: {res.content}")
    except Exception as e:
        print(f"Failed {model_name}: {str(e)[:150]}")
