# Solas Trace Running Script (Windows PowerShell)

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "          Starting Solas Trace Setup         " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Start the Rust Backend
Write-Host "`n[1/2] Building and running Rust backend on http://localhost:8080..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; cargo run" -WindowStyle Normal

# 2. Start the Vite React Frontend
Write-Host "`n[2/2] Launching React frontend on http://localhost:3000..." -ForegroundColor Yellow
if (Test-Path "frontend/node_modules") {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal
} else {
    Write-Host "frontend/node_modules not found. Installing packages first..." -ForegroundColor Magenta
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm install; npm run dev" -WindowStyle Normal
}

Write-Host "`nReady! The browser proxy is open at http://localhost:8080/v1" -ForegroundColor Green
Write-Host "Dashboard will open shortly on http://localhost:3000" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
