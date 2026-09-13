@echo off
title ReceiptParser.io - Local API Server
echo ========================================================
echo Starting ReceiptParser.io Local API Server...
echo ========================================================

cd /d "%~dp0api"

if not exist ".env" (
    echo [WARNING] .env file not found in api\ directory!
    echo Creating api\.env from .env.example...
    copy .env.example .env
    echo Please edit api\.env with your Supabase DATABASE_URL and GEMINI_API_KEY.
    echo.
)

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install --include=dev
)

echo Building TypeScript API...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] TypeScript compilation failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo API compiled successfully!
echo Starting server on http://localhost:10000 ...
echo Health check: http://localhost:10000/v1/health
echo Press Ctrl+C to stop the server anytime.
echo ========================================================
echo.

call npm start