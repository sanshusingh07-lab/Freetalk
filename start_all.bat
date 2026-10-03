@echo off
echo ================================================
echo      FreeTalk - Ideas Over Identity Launcher     
echo ================================================

start "FreeTalk Moderation (Port 8000)" cmd /k "cd /d d:\miniproject sanshu\moderation-service && python -m uvicorn app.main:app --port 8000 --reload"
start "FreeTalk Backend (Port 5000)" cmd /k "cd /d d:\miniproject sanshu\backend && npm run dev"
start "FreeTalk Frontend (Port 5173)" cmd /k "cd /d d:\miniproject sanshu\frontend && npm run dev"

echo All services dispatched!
echo Frontend: http://localhost:5173
pause
