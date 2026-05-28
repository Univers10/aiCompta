# Script de backup de la base de données PostgreSQL
# SYSCOHADA 2025 - Phase 2 Migration

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BACKUP BASE DE DONNÉES - SYSCOHADA 2025" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$DB_NAME = "aicompta"
$DB_USER = "postgres"
$BACKUP_DIR = ".\migration\backups"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR\aicompta_pre_syscohada_2025_$TIMESTAMP.sql"

# Créer le dossier de backup s'il n'existe pas
if (-not (Test-Path $BACKUP_DIR)) {
    Write-Host "📁 Création du dossier de backup..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

Write-Host "🔒 Backup de la base de données en cours..." -ForegroundColor Yellow
Write-Host "   Base: $DB_NAME" -ForegroundColor Gray
Write-Host "   Fichier: $BACKUP_FILE" -ForegroundColor Gray
Write-Host ""

try {
    # Exécuter pg_dump
    & pg_dump -U $DB_USER -d $DB_NAME -f $BACKUP_FILE
    
    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $BACKUP_FILE).Length / 1MB
        Write-Host "✅ Backup réussi !" -ForegroundColor Green
        Write-Host "   Taille: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Gray
        Write-Host "   Emplacement: $BACKUP_FILE" -ForegroundColor Gray
        Write-Host ""
        
        # Créer aussi une copie de sécurité du schéma actuel
        $SCHEMA_BACKUP = "$BACKUP_DIR\schema_old_$TIMESTAMP.prisma"
        Copy-Item ".\apps\api\prisma\schema.prisma" $SCHEMA_BACKUP
        Write-Host "✅ Schéma Prisma sauvegardé" -ForegroundColor Green
        Write-Host "   Emplacement: $SCHEMA_BACKUP" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  BACKUP TERMINÉ AVEC SUCCÈS" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        
        exit 0
    } else {
        throw "pg_dump a échoué avec le code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ ERREUR lors du backup !" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vérifiez que PostgreSQL est installé et accessible." -ForegroundColor Yellow
    Write-Host "Commande: pg_dump -U $DB_USER -d $DB_NAME" -ForegroundColor Yellow
    exit 1
}
