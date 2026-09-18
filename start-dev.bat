@echo off
setlocal enabledelayedexpansion
title VANA — Architectural Woodcraft - Live Development Mode

:: Ensure current working directory is the folder where this batch file lives
cd /d "%~dp0"

echo ========================================================================
echo   VANA — ARCHITECTURAL HARDWOOD & CAD MANUFACTURING ATELIER
echo   Vite Client (Port 5173) + Express Backend API (Port 5000)
echo ========================================================================
echo.

:: 1. Verify Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in system PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

:: 2. Check Dependencies
if not exist "server\node_modules\" (
    echo Installing server packages...
    cd /d "%~dp0server"
    call npm install
    cd /d "%~dp0"
)

if not exist "client\node_modules\" (
    echo Installing client packages...
    cd /d "%~dp0client"
    call npm install
    cd /d "%~dp0"
)

echo.
echo Launching development services...
echo   * Vite Dev Client:   http://localhost:5173
echo   * Backend REST API:  http://localhost:5000
echo.

:: Ensure Port 5000 is clean and unblocked before starting
powershell -NoProfile -Command "try { Get-NetTCPConnection -LocalPort 5000 -ErrorAction Stop | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } } catch {} exit 0" >nul 2>&1

:: Start concurrent dev servers in their own window
start "VANA Dev Servers" node scripts/dev.js

:: Wait until Vite is actually listening BEFORE opening the browser.
:: Opening it early hits a dead port and the user has to reload 2-3 times.
echo Waiting for Vite on http://localhost:5173 ...
powershell -NoProfile -Command "$t=0; while ($t -lt 90) { $c=New-Object Net.Sockets.TcpClient; try { $c.Connect('127.0.0.1', 5173); $c.Close(); break } catch {}; Start-Sleep -Seconds 1; $t++ }; if ($t -ge 90) { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Vite did not start within 90 seconds. Check the "VANA Dev Servers" window for errors.
    pause
    exit /b 1
)

echo Vite is up. Opening browser...
start http://localhost:5173

echo.
echo Development servers are running in the "VANA Dev Servers" window.
echo Close that window (Ctrl+C) to stop. You can close this window.
pause
