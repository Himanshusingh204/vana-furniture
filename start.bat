@echo off
setlocal enabledelayedexpansion
title VANA — Architectural Woodcraft Full Stack Server

:: Ensure current working directory is the folder where this batch file lives
cd /d "%~dp0"

echo ========================================================================
echo   VANA — ARCHITECTURAL WOODCRAFT & CAD WORKS
echo   Manufacturing Plant: Basni Industrial Area Phase II, Jodhpur, India
echo ========================================================================
echo.

:: 1. Verify Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in system PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

:: 2. Check Server Dependencies
if not exist "server\node_modules\" (
    echo [1/3] Installing server dependencies...
    cd /d "%~dp0server"
    call npm install
    cd /d "%~dp0"
) else (
    echo [1/3] Server dependencies verified.
)

:: 3. Check Client Dependencies & Production Build
if not exist "client\node_modules\" (
    echo [2/3] Installing client dependencies...
    cd /d "%~dp0client"
    call npm install
    cd /d "%~dp0"
) else (
    echo [2/3] Client dependencies verified.
)

if not exist "client\dist\" (
    echo [3/3] Compiling luxury client distribution bundle...
    cd /d "%~dp0client"
    call npm run build
    cd /d "%~dp0"
) else (
    echo [3/3] Production client bundle verified.
)

echo.
echo ========================================================================
echo   SERVICES READY - STARTING UNIFIED FULL-STACK SERVER (PORT 5000)
echo ========================================================================
echo.
echo   * Client Storefront:      http://localhost:5000
echo   * Factory Admin Console:  http://localhost:5000/admin
echo   * Admin Login:            see ADMIN_EMAIL in your environment
echo                             (default dev login lives in server\data\users.json -
echo                              change it via ADMIN_PASSWORD_HASH before going live)
echo   * Factory Concierge:      +91 98290 14820 (Basni Plant II)
echo.
echo   (Press Ctrl+C at any time in this window to stop the server)
echo ========================================================================
echo.

:: Ensure Port 5000 is clean and unblocked before starting
powershell -NoProfile -Command "try { Get-NetTCPConnection -LocalPort 5000 -ErrorAction Stop | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } } catch {} exit 0" >nul 2>&1

:: Start the server in its own window
start "VANA Production Server" node server/server.js

:: Wait until the API actually answers BEFORE opening the browser.
:: Opening it early hits a dead port and the user has to reload 2-3 times.
echo Waiting for server on http://localhost:5000 ...
powershell -NoProfile -Command "$t=0; while ($t -lt 90) { try { Invoke-WebRequest 'http://127.0.0.1:5000/api/health' -UseBasicParsing -TimeoutSec 2 | Out-Null; break } catch {}; Start-Sleep -Seconds 1; $t++ }; if ($t -ge 90) { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Server did not answer within 90 seconds. Check the "VANA Production Server" window for errors.
    pause
    exit /b 1
)

echo Server is up. Opening browser...
start http://localhost:5000

echo.
echo Production server is running in the "VANA Production Server" window.
echo Close that window (Ctrl+C) to stop. You can close this window.
pause
