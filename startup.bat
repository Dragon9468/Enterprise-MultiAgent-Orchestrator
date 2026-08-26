@echo off
echo Starting Enterprise Multi-Agent Services...

:: Start PocketBase
echo Starting PocketBase...
cd /d "%~dp0pocketbase"
start "PocketBase" cmd /c "pocketbase.exe serve"

:: Start Next.js Frontend
echo Starting Next.js Frontend...
cd /d "%~dp0super-app-frontend"
start "Next.js Frontend" cmd /c "npm run dev"

echo Services have been started in separate windows.
pause
