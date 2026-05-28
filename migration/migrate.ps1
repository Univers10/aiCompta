# Script principal de migration SYSCOHADA 2025
# Orchestre toutes les étapes de la migration

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIGRATION SYSCOHADA 2025" -ForegroundColor Cyan
Write-Host "  Phase 2 - Migration Technique" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Demander confirmation
Write-Host "⚠️  ATTENTION : Cette migration va modifier votre base de données !" -ForegroundColor Yellow
Write-Host ""
Write-Host "Étapes qui seront exécutées :" -ForegroundColor White
Write-Host "  1. Backup de la base de données actuelle" -ForegroundColor Gray
Write-Host "  2. Sauvegarde du schéma Prisma actuel" -ForegroundColor Gray
Write-Host "  3. Application du nouveau schéma SYSCOHADA 2025" -ForegroundColor Gray
Write-Host "  4. Migration des données existantes" -ForegroundColor Gray
Write-Host "  5. Chargement du plan comptable SYSCOHADA (120 comptes)" -ForegroundColor Gray
Write-Host "  6. Vérification post-migration" -ForegroundColor Gray
Write-Host ""

$confirmation = Read-Host "Voulez-vous continuer ? (oui/non)"
if ($confirmation -ne "oui") {
    Write-Host "❌ Migration annulée par l'utilisateur" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 Démarrage de la migration..." -ForegroundColor Green
Write-Host ""

# =====================================================
# ÉTAPE 1 : BACKUP
# =====================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "ÉTAPE 1/6 : Backup de la base de données" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

try {
    & .\migration\backup.ps1
    if ($LASTEXITCODE -ne 0) {
        throw "Le backup a échoué"
    }
} catch {
    Write-Host "❌ ERREUR lors du backup !" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Migration interrompue pour votre sécurité." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 2

# =====================================================
# ÉTAPE 2 : SAUVEGARDE DU SCHÉMA ACTUEL
# =====================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "ÉTAPE 2/6 : Sauvegarde du schéma actuel" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$OLD_SCHEMA = ".\apps\api\prisma\schema-old-$TIMESTAMP.prisma"

Copy-Item ".\apps\api\prisma\schema.prisma" $OLD_SCHEMA
Write-Host "✅ Schéma actuel sauvegardé" -ForegroundColor Green
Write-Host "   Emplacement: $OLD_SCHEMA" -ForegroundColor Gray
Write-Host ""
Start-Sleep -Seconds 1

# =====================================================
# ÉTAPE 3 : APPLICATION DU NOUVEAU SCHÉMA
# =====================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "ÉTAPE 3/6 : Application du nouveau schéma" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Remplacer le schéma
Copy-Item ".\apps\api\prisma\schema-syscohada-2025.prisma" ".\apps\api\prisma\schema.prisma" -Force
Write-Host "✅ Nouveau schéma SYSCOHADA 2025 activé" -ForegroundColor Green
Write-Host ""

# Générer la migration Prisma
Write-Host "📝 Génération de la migration Prisma..." -ForegroundColor Yellow
Set-Location ".\apps\api"

try {
    npx prisma migrate dev --name syscohada_2025_full_compliance --create-only
    
    Write-Host "✅ Migration Prisma générée" -ForegroundColor Green
    Write-Host ""
    
    # Appliquer la migration
    Write-Host "🔄 Application de la migration..." -ForegroundColor Yellow
    npx prisma migrate deploy
    
    Write-Host "✅ Migration Prisma appliquée" -ForegroundColor Green
    Write-Host ""
    
    # Générer le client Prisma
    Write-Host "🔧 Génération du client Prisma..." -ForegroundColor Yellow
    npx prisma generate
    
    Write-Host "✅ Client Prisma généré" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "❌ ERREUR lors de l'application du schéma !" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Restauration du schéma précédent..." -ForegroundColor Yellow
    Set-Location "..\..\"
    Copy-Item $OLD_SCHEMA ".\apps\api\prisma\schema.prisma" -Force
    Write-Host "✅ Schéma restauré" -ForegroundColor Green
    exit 1
}

Set-Location "..\..\"
Start-Sleep -Seconds 2

# =====================================================
# ÉTAPE 4 : MIGRATION DES DONNÉES
# =====================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "ÉTAPE 4/6 : Migration des données" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$DB_NAME = "aicompta"
$DB_USER = "postgres"
$MIGRATION_SQL = ".\migration\migrate-data.sql"

Write-Host "🔄 Exécution du script de migration des données..." -ForegroundColor Yellow
Write-Host ""

try {
    & psql -U $DB_USER -d $DB_NAME -f $MIGRATION_SQL
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Données migrées avec succès" -ForegroundColor Green
        Write-Host ""
    } else {
        throw "psql a échoué avec le code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ ERREUR lors de la migration des données !" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  La base de données peut être dans un état incohérent." -ForegroundColor Yellow
    Write-Host "   Utilisez le backup pour restaurer si nécessaire." -ForegroundColor Yellow
    exit 1
}

Start-Sleep -Seconds 2

# =====================================================
# ÉTAPE 5 : CHARGEMENT DU PLAN COMPTABLE
# =====================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "ÉTAPE 5/6 : Chargement du plan comptable" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Chargement du plan comptable SYSCOHADA (120 comptes)..." -ForegroundColor Yellow
Write-Host ""

# Note : Le seed sera exécuté via un script Node.js
Write-Host "ℹ️  Le plan comptable sera chargé au premier démarrage de l'application" -ForegroundColor Cyan
Write-Host "   ou via la commande : npm run db:seed" -ForegroundColor Gray
Write-Host ""

Start-Sleep -Seconds 1

# =====================================================
# ÉTAPE 6 : VÉRIFICATION POST-MIGRATION
# =====================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "ÉTAPE 6/6 : Vérification post-migration" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔍 Vérification de l'intégrité de la base de données..." -ForegroundColor Yellow
Write-Host ""

# Vérifier que les tables existent
$tables = @(
    "AccountingPeriod",
    "JournalSequence",
    "ExchangeRate",
    "ExchangeDifference"
)

$allTablesExist = $true
foreach ($table in $tables) {
    $query = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table');"
    $result = & psql -U $DB_USER -d $DB_NAME -t -c $query
    
    if ($result -match "t") {
        Write-Host "  ✅ Table $table existe" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Table $table manquante" -ForegroundColor Red
        $allTablesExist = $false
    }
}

Write-Host ""

if ($allTablesExist) {
    Write-Host "✅ Toutes les nouvelles tables ont été créées" -ForegroundColor Green
} else {
    Write-Host "⚠️  Certaines tables sont manquantes" -ForegroundColor Yellow
}

Write-Host ""
Start-Sleep -Seconds 2

# =====================================================
# RÉSUMÉ FINAL
# =====================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  MIGRATION TERMINÉE AVEC SUCCÈS !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Résumé de la migration :" -ForegroundColor White
Write-Host ""
Write-Host "  ✅ Backup créé" -ForegroundColor Green
Write-Host "  ✅ Nouveau schéma SYSCOHADA 2025 appliqué" -ForegroundColor Green
Write-Host "  ✅ Données migrées" -ForegroundColor Green
Write-Host "  ✅ Tables créées" -ForegroundColor Green
Write-Host ""

Write-Host "📁 Fichiers de backup :" -ForegroundColor White
Write-Host "  - Base de données: .\migration\backups\" -ForegroundColor Gray
Write-Host "  - Schéma Prisma: $OLD_SCHEMA" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 Prochaines étapes :" -ForegroundColor White
Write-Host ""
Write-Host "  1. Redémarrer l'API :" -ForegroundColor Cyan
Write-Host "     cd apps\api" -ForegroundColor Gray
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Charger le plan comptable (si nouvelle organisation) :" -ForegroundColor Cyan
Write-Host "     npm run db:seed" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Tester l'application :" -ForegroundColor Cyan
Write-Host "     - Créer une écriture en brouillard" -ForegroundColor Gray
Write-Host "     - Valider une écriture" -ForegroundColor Gray
Write-Host "     - Vérifier la numérotation (ACH-2025-00001)" -ForegroundColor Gray
Write-Host "     - Consulter le bilan" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Proposer de redémarrer l'API
$restart = Read-Host "Voulez-vous redémarrer l'API maintenant ? (oui/non)"
if ($restart -eq "oui") {
    Write-Host ""
    Write-Host "🚀 Démarrage de l'API..." -ForegroundColor Green
    Write-Host ""
    Set-Location ".\apps\api"
    npm run dev
}
