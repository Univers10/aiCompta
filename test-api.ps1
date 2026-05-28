# Test rapide de l'API

Write-Host "Test de l'API..." -ForegroundColor Cyan

# Test health
Write-Host "`nTest /health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get
    Write-Host "  OK: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR: $_" -ForegroundColor Red
}

# Test documents
Write-Host "`nTest /api/v1/documents..." -ForegroundColor Yellow
try {
    $docs = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/documents?limit=10" -Method Get
    Write-Host "  OK: $($docs.data.Count) documents" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR: $_" -ForegroundColor Red
}

# Test journal entries
Write-Host "`nTest /api/v1/journal-entries..." -ForegroundColor Yellow
try {
    $entries = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/journal-entries?limit=10" -Method Get
    Write-Host "  OK: $($entries.data.Count) entries" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR: $_" -ForegroundColor Red
}

# Test chart of accounts
Write-Host "`nTest /api/v1/settings/chart-of-accounts..." -ForegroundColor Yellow
try {
    $accounts = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/settings/chart-of-accounts" -Method Get
    Write-Host "  OK: $($accounts.data.Count) comptes" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR: $_" -ForegroundColor Red
}

# Test members
Write-Host "`nTest /api/v1/settings/members..." -ForegroundColor Yellow
try {
    $members = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/settings/members" -Method Get
    Write-Host "  OK: $($members.data.Count) membres" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR: $_" -ForegroundColor Red
}

Write-Host "`nTests termines!" -ForegroundColor Cyan
