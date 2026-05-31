@echo off
setlocal EnableExtensions

cd /d "%~dp0"

where mvn >nul 2>nul
if errorlevel 1 (
  echo Maven was not found in PATH.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found in PATH.
  exit /b 1
)

set "AI_CMD=python main.py"
where conda >nul 2>nul
if not errorlevel 1 (
  set "AI_CMD=call conda activate event-ai && python main.py"
)

echo Starting backend...
pushd "%~dp0backend"
start "" /B cmd /c "mvn spring-boot:run"
popd

echo Starting frontend...
pushd "%~dp0frontend"
start "" /B cmd /c "npm run dev"
popd

echo Starting AI...
pushd "%~dp0AI"
start "" /B cmd /c "%AI_CMD%"
popd

echo.
echo All services are running in this same terminal session.
echo Close this window to stop them, or press Ctrl+C and then Y.

pause
