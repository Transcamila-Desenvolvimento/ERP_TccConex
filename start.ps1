# TccConex ERP - Script de inicializacao do ambiente de desenvolvimento
# Uso: ./start.ps1

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$PYTHON = "$ROOT\backend\venv\Scripts\python.exe"
$MANAGE = "$ROOT\backend\manage.py"
$FRONTEND = "$ROOT\frontend"

Write-Host ""
Write-Host "=== TccConex ERP - Iniciando servidores ===" -ForegroundColor Cyan
Write-Host ""

# Verifica se o venv existe
if (-not (Test-Path $PYTHON)) {
    Write-Host "[ERRO] Venv nao encontrado em backend\venv" -ForegroundColor Red
    Write-Host "Execute primeiro: python -m virtualenv backend\venv" -ForegroundColor Yellow
    Write-Host "Depois: backend\venv\Scripts\pip install -r backend\requirements.txt" -ForegroundColor Yellow
    exit 1
}

# Verifica se node_modules existe
if (-not (Test-Path "$FRONTEND\node_modules")) {
    Write-Host "[AVISO] node_modules nao encontrado. Instalando dependencias..." -ForegroundColor Yellow
    Set-Location $FRONTEND
    npm install
    Set-Location $ROOT
}

# Inicia Django em nova janela
Write-Host "[1/2] Iniciando Django (http://localhost:8001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$PYTHON' '$MANAGE' runserver 8001" -WindowStyle Normal

Start-Sleep -Milliseconds 1500

# Inicia Vite em nova janela
Write-Host "[2/2] Iniciando Vite (http://localhost:5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$FRONTEND'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Servidores iniciados!" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8001" -ForegroundColor White
Write-Host ""
