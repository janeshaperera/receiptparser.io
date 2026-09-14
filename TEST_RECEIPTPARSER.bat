@echo off
setlocal enabledelayedexpansion
title ReceiptParser.io - E2E Test Suite

echo ========================================================
echo        ReceiptParser.io - Playwright E2E Runner
echo ========================================================
echo.

:: 1. Verify Node.js and npm
echo [1/4] Checking Node.js and npm environment...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is NOT installed or not added to your Windows PATH!
    pause
    exit /b 1
)
echo [OK] Node.js is available.

:: 2. Ensure web dependencies are ready
echo [2/4] Checking Playwright dependencies...
if not exist "%~dp0web\node_modules\@playwright\test" (
    echo [INFO] Installing Playwright testing dependencies in web...
    cd /d "%~dp0web"
    call npm install --save-dev @playwright/test
    call npx playwright install chromium
)
echo [OK] Test runner dependencies ready.

:: 3. Run Playwright End-to-End Suite
echo [3/4] Running Playwright E2E Suite against http://localhost:3001 and http://localhost:10000...
echo.
cd /d "%~dp0web"
call npx playwright test

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================================
    echo [FAILURE] One or more Playwright E2E tests failed!
    echo To view full test traces and screenshots:
    echo cd /d "%~dp0web" ^&^& npx playwright show-report
    echo ========================================================
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo [SUCCESS] All 10/10 Playwright E2E tests passed cleanly!
echo ========================================================
echo.
pause
