# Demarrage des serveurs

Write-Host "Demarrage des serveurs de developpement..." -ForegroundColor Cyan

# Nettoyer les ports
$port3000 = (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue).OwningProcess
$port3001 = (Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue).OwningProcess

if ($port3000) { Stop-Process -Id $port3000 -Force -ErrorAction SilentlyContinue }
if ($port3001) { Stop-Process -Id $port3001 -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 2

# Demarrer API
Write-Host "Demarrage API sur port 3001..." -ForegroundColor Green
$apiPath = Join-Path $PSScriptRoot "apps\api"
Start-Process powershell -ArgumentList "-NoExit -Command cd '$apiPath'; npm run dev"

Start-Sleep -Seconds 5

# Demarrer frontend
Write-Host "Demarrage frontend sur port 3000..." -ForegroundColor Green
$webPath = Join-Path $PSScriptRoot "apps\web"
Start-Process powershell -ArgumentList "-NoExit -Command cd '$webPath'; npm run dev"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Serveurs demarres!" -ForegroundColor Green
Write-Host "  API:      http://localhost:3001" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Utilisateur dev automatique (pas de login)" -ForegroundColor Yellow
Write-Host "  Organisation: dev-org" -ForegroundColor Gray
Write-Host "  User: dev@test.com" -ForegroundColor Gray
