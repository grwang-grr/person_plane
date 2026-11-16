@echo off
setlocal
chcp 65001 >nul
set "PYTHONUTF8=1"
for %%i in ("%~dp0..") do set "WPLANE_ROOT=%%~fi"
cd /d "%WPLANE_ROOT%"
set "PERSONAL_PYTHON=%WPLANE_ROOT%\upstream\plane\apps\api\.venv\Scripts\python.exe"
if not exist "%PERSONAL_PYTHON%" (
  echo Missing Python runtime. See docs\03-development\plane-personal.md
  pause
  exit /b 1
)
if not exist "%WPLANE_ROOT%\upstream\plane\apps\web\build\client\index.html" (
  echo Missing web build. Run: pnpm turbo run build --filter=web
  pause
  exit /b 1
)
netstat -ano | findstr ":8008 " | findstr "LISTENING" >nul
if not errorlevel 1 (
  echo Personal app is already running: http://127.0.0.1:8008/personal/
  start "" "http://127.0.0.1:8008/personal/"
  exit /b 0
)
"%PERSONAL_PYTHON%" "%WPLANE_ROOT%\scripts\start_plane_personal.py"
if errorlevel 1 (
  echo Startup failed. See data\logs\plane-personal.log
  pause
)
endlocal
