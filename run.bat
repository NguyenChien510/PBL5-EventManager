@echo off
title EventManager Runner
cls
echo ====================================================================
echo             Event Management and Ticketing Platform Runner           
echo ====================================================================
echo.
echo [*] Launching all services in this terminal window...
echo.

:: 1. Launch Backend (Spring Boot)
echo [1/3] Starting Backend (Spring Boot) via mvn...
start /b cmd /c "cd backend && mvn spring-boot:run"

:: 2. Launch AI Service (FastAPI)
echo [2/3] Starting AI Service (FastAPI)...
if exist "AI\.venv\Scripts\activate.bat" (
    start /b cmd /c "cd AI && call .venv\Scripts\activate && uvicorn main:app --reload --port 8000"
    goto :run_fe
)
if exist "AI\venv\Scripts\activate.bat" (
    start /b cmd /c "cd AI && call venv\Scripts\activate && uvicorn main:app --reload --port 8000"
    goto :run_fe
)
start /b cmd /c "cd AI && uvicorn main:app --reload --port 8000"

:run_fe
:: 3. Launch Frontend (React / Vite)
echo [3/3] Starting Frontend (React / Vite)...
if not exist "frontend\node_modules\" (
    echo [INFO] node_modules not found in frontend. Installing dependencies...
    cd frontend
    call npm install
    cd ..
)
start /b cmd /c "cd frontend && npm run dev"

echo.
echo ====================================================================
echo   All services have been started in the background of this window.
echo   Press Ctrl+C or close this window to terminate all services.
echo ====================================================================
echo.

:: Keep the terminal window open to display logs and keep services alive
pause > nul
