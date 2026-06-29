# Solas Trace Running Script (Windows PowerShell)

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "          Starting Solas Trace Setup         " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Start the Rust Backend
Write-Host "`n[1/2] Building and running Rust backend on http://localhost:8000..." -ForegroundColor Yellow
$env:PORT="8000"
$env:DATABASE_URL="sqlite://data/solas-trace.db"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd crates/engine; cargo run" -WindowStyle Normal

# 2. Start the Next.js Frontend
Write-Host "`n[2/2] Launching Next.js frontend on http://localhost:3000..." -ForegroundColor Yellow
if (Test-Path "ui/node_modules") {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ui; npm run dev" -WindowStyle Normal
} else {
    Write-Host "ui/node_modules not found. Installing packages first..." -ForegroundColor Magenta
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ui; npm install; npm run dev" -WindowStyle Normal
}

Write-Host "`nReady! The browser proxy is open at http://localhost:8000/v1" -ForegroundColor Green
Write-Host "Dashboard will open shortly on http://localhost:3000" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
