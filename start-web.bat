@echo off
setlocal enabledelayedexpansion
title ReceiptParser.io - Local Web Frontend (Port 3001)

echo ========================================================
echo       ReceiptParser.io - Next.js Frontend
echo ========================================================
echo.

:: 1. Navigate into web directory
cd /d "%~dp0web"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Could not find the web directory at "%~dp0web"
    goto :ON_ERROR
)

:: 2. Check if .env.local exists, if not create it
if not exist ".env.local" (
    echo [INFO] web\.env.local not found. Creating with NEXT_PUBLIC_API_URL=http://localhost:10000...
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:10000
    ) > ".env.local"
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to write web\.env.local!
        goto :ON_ERROR
    )
    echo [SUCCESS] Created web\.env.local file.
) else (
    echo [OK] web\.env.local file found.
)

:: 3. Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo.
    echo [INFO] node_modules folder missing. Installing web dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] npm install failed!
        goto :ON_ERROR
    )
    echo [SUCCESS] Dependencies installed successfully.
) else (
    echo [OK] node_modules folder found.
)

:: 4. Start Next.js Frontend on port 3001
echo.
echo ========================================================
echo Frontend starting on: http://localhost:3001
echo Connected API:        http://localhost:10000
echo Press Ctrl+C anytime to stop the server.
echo ========================================================
echo.

call npm run dev
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Next.js frontend server exited with code %ERRORLEVEL%.
    goto :ON_ERROR
)

goto :EOF

:ON_ERROR
echo.
echo ========================================================
echo [FAILED] An error occurred while starting the frontend.
echo Please review the messages above.
echo ========================================================
pause
exit /b 1