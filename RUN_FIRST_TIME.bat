@echo off
cd /d "%~dp0"
start "" cmd /c "cd server && npm install package"
start "" cmd /c "npm install package"