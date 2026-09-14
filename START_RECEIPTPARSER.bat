@echo off
setlocal enabledelayedexpansion
title ReceiptParser.io - Master Launcher

echo ========================================================
echo        ReceiptParser.io - Master One-Click Launcher
echo ========================================================
echo.

:: 1. Verify Node.js and npm are installed
echo [1/5] Checking Node.js and npm environment...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Node.js is NOT installed or not added to your Windows PATH!
    echo Please download and install Node.js from https://nodejs.org
    echo After installing, double-click START_RECEIPTPARSER.bat again.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] npm is NOT found in your PATH!
    echo Please verify your Node.js installation.
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js and npm are available.

:: 2. Check and prepare API configuration (never overwrite existing .env)
echo [2/5] Checking API configuration...
if not exist "%~dp0api\.env" (
    if exist "%~dp0api\.env.example" (
        echo [INFO] Creating api\.env from api\.env.example...
        copy /y "%~dp0api\.env.example" "%~dp0api\.env" >nul
        echo [OK] api\.env created.
    )
) else (
    echo [OK] Existing api\.env preserved.
)

:: 3. Check and prepare Web frontend configuration
echo [3/5] Checking Web configuration...
if not exist "%~dp0web\.env.local" (
    echo [INFO] Creating web\.env.local...
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:10000
    ) > "%~dp0web\.env.local"
    echo [OK] web\.env.local configured with NEXT_PUBLIC_API_URL=http://localhost:10000.
) else (
    echo [OK] web\.env.local verified.
)

:: 4. Start API Server in dedicated window
echo [4/5] Launching API Server on port 10000...
start "ReceiptParser.io API Server (Port 10000)" cmd.exe /k "cd /d ""%~dp0"" && call ""%~dp0start-local.bat"""

:: 5. Start Web Frontend in dedicated window
echo [5/5] Launching Web Frontend on port 3001...
start "ReceiptParser.io Web Frontend (Port 3001)" cmd.exe /k "cd /d ""%~dp0"" && call ""%~dp0start-web.bat"""

:: 6. Wait briefly for servers to spin up, then open browser
echo.
echo ========================================================
echo ReceiptParser.io is starting up!
echo - API running on:      http://localhost:10000
echo - Frontend running on: http://localhost:3001
echo.
echo Opening http://localhost:3001 in your default browser...
echo (Both server command windows will remain open)
echo ========================================================
echo.

timeout /t 5 /nobreak >nul
start http://localhost:3001

echo.
echo [INFO] ReceiptParser.io is now active.
echo To stop the servers later, simply close the API and Web command windows.
echo.
pause
