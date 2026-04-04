@echo off
echo Starting EventPlatform AI Assistant...

call conda activate event-ai

uvicorn main:app --reload --port 8000

pause