@echo off
title MINEGUARD - Starting Servers...
color 0A

echo.
echo  ███╗   ███╗██╗███╗   ██╗███████╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗ 
echo  ████╗ ████║██║████╗  ██║██╔════╝██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗
echo  ██╔████╔██║██║██╔██╗ ██║█████╗  ██║  ███╗██║   ██║███████║██████╔╝██║  ██║
echo  ██║╚██╔╝██║██║██║╚██╗██║██╔══╝  ██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║
echo  ██║ ╚═╝ ██║██║██║ ╚████║███████╗╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
echo  ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ 
echo.
echo  SIH 2026 - Integrated Mine Safety Monitoring System
echo  -------------------------------------------------------
echo.

:: Start Backend in a new window
echo  [1/2] Starting Backend (FastAPI on port 8000)...
start "MINEGUARD Backend" cmd /k "cd /d "%~dp0" && if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat) && uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000"

:: Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak > nul

:: Start Frontend in a new window
echo  [2/2] Starting Frontend (Vite/React on port 5173)...
start "MINEGUARD Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

:: Wait a moment then open browser
timeout /t 4 /nobreak > nul

echo.
echo  -------------------------------------------------------
echo  [OK] Backend  --^>  http://localhost:8000
echo  [OK] Frontend --^>  http://localhost:5173
echo  [OK] API Docs --^>  http://localhost:8000/docs
echo  -------------------------------------------------------
echo.
echo  Opening browser...
start http://localhost:5173

echo.
echo  Both servers are running in separate windows.
echo  Close those windows to stop the servers.
echo.
pause
