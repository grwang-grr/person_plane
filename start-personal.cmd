@echo off
setlocal
chcp 65001 >nul
set "PYTHONUTF8=1"
cd /d "%~dp0"
set "PERSONAL_PYTHON=%~dp0upstream\plane\apps\api\.venv\Scripts\python.exe"
if not exist "%PERSONAL_PYTHON%" (
  echo 缺少个人版运行环境，请参阅 docs/03-development/plane-personal.md
  pause
  exit /b 1
)
"%PERSONAL_PYTHON%" "%~dp0scripts\start_plane_personal.py"
if errorlevel 1 (
  echo 启动失败，请查看 data\logs\plane-personal.log
  pause
)
endlocal
