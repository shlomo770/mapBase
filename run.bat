@echo off
chcp 65001 >nul
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error installing dependencies!
    pause
    exit /b %errorlevel%
)
echo.
echo Starting development server...
call npm run dev
pause

