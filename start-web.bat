@echo off
title ReceiptParser.io - Local Web Frontend
echo ========================================================
echo Starting ReceiptParser.io Next.js Frontend...
echo ========================================================

cd /d "%~dp0web"

if not exist ".env.local" (
    echo Creating web\.env.local...
    echo NEXT_PUBLIC_API_URL=http://localhost:10000> .env.local
)

if not exist "node_modules" (
    echo Installing web dependencies...
    call npm install
)

echo.
echo ========================================================
echo Starting web app on http://localhost:3001 ...
echo Connects to API at http://localhost:10000
echo ========================================================
echo.

call npm run dev