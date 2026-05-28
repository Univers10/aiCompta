# Script de redemarrage de l'API AiCompta
# Usage: .\restart-api.ps1

Write-Host "Redemarrage de l'API AiCompta..." -ForegroundColor Cyan

# Arreter les processus Node.js existants (API)
Write-Host "Arret des processus existants..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*aicompta*" } | Stop-Process -Force

Start-Sleep -Seconds 2

# Demarrer l'API
Write-Host "Demarrage de l'API..." -ForegroundColor Green
Set-Location -Path "apps\api"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "API redemarree avec succes!" -ForegroundColor Green
Write-Host "L'API devrait etre disponible sur http://localhost:3001" -ForegroundColor Cyan
Write-Host "Le frontend est sur http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Rafraichissez la page Balance pour voir les corrections SYSCOHADA" -ForegroundColor Yellow
