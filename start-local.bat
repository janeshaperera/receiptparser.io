@echo off
setlocal enabledelayedexpansion
title ReceiptParser.io - Local API Server (Port 10000)

echo ========================================================
echo        ReceiptParser.io - Local API Server
echo ========================================================
echo.

:: 1. Navigate into api directory
cd /d "%~dp0api"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Could not find the api directory at "%~dp0api"
    goto :ON_ERROR
)

:: 2. Check if .env exists, if not create from .env.example
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] api\.env not found. Creating api\.env from api\.env.example...
        copy /y ".env.example" ".env" >nul
        if %ERRORLEVEL% NEQ 0 (
            echo [ERROR] Failed to copy .env.example to .env
            goto :ON_ERROR
        )
        echo [SUCCESS] Created api\.env file.
    ) else (
        echo [WARNING] Neither api\.env nor api\.env.example was found.
    )
) else (
    echo [OK] api\.env file found.
)

:: 3. Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo.
    echo [INFO] node_modules folder missing. Installing API dependencies...
    call npm install --include=dev
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] npm install failed!
        goto :ON_ERROR
    )
    echo [SUCCESS] Dependencies installed successfully.
) else (
    echo [OK] node_modules folder found.
)

:: 4. Build TypeScript API
echo.
echo [INFO] Building TypeScript API (npm run build)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] TypeScript compilation failed!
    goto :ON_ERROR
)
echo [SUCCESS] API built successfully!

:: 5. Start API Server on http://localhost:10000
echo.
echo ========================================================
echo API Server starting on: http://localhost:10000
echo Health Check:           http://localhost:10000/v1/health
echo Press Ctrl+C anytime to stop the server.
echo ========================================================
echo.

call npm start
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] API server exited with code %ERRORLEVEL%.
    goto :ON_ERROR
)

goto :EOF

:ON_ERROR
echo.
echo ========================================================
echo [FAILED] An error occurred during startup.
echo Please review the messages above.
echo ========================================================
pause
exit /b 1