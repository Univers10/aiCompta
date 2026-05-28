# 🚀 Migration SYSCOHADA 2025 - Guide d'Exécution

**Phase 2 : Migration Technique**

---

## 📋 Pré-requis

Avant de lancer la migration, assurez-vous que :

- ✅ PostgreSQL est installé et accessible
- ✅ La base de données `aicompta` existe
- ✅ Node.js 18+ est installé
- ✅ Les dépendances npm sont installées (`npm install`)
- ✅ L'API et le frontend sont arrêtés
- ✅ Vous avez lu la documentation (`MIGRATION_SYSCOHADA_2025.md`)

---

## 🎯 Exécution de la Migration

### Option 1 : Script Automatique (Recommandé)

```powershell
# Depuis la racine du projet
.\migration\migrate.ps1
```

Ce script orchestre automatiquement toutes les étapes :
1. Backup de la base de données
2. Sauvegarde du schéma Prisma actuel
3. Application du nouveau schéma SYSCOHADA 2025
4. Migration des données existantes
5. Vérification post-migration
6. Proposition de redémarrage de l'API

### Option 2 : Étape par Étape (Manuel)

#### Étape 1 : Backup

```powershell
.\migration\backup.ps1
```

Crée un backup complet de la base de données dans `.\migration\backups\`

#### Étape 2 : Application du Schéma

```powershell
# Sauvegarder l'ancien schéma
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item ".\apps\api\prisma\schema.prisma" ".\apps\api\prisma\schema-old-$TIMESTAMP.prisma"

# Activer le nouveau schéma
Copy-Item ".\apps\api\prisma\schema-syscohada-2025.prisma" ".\apps\api\prisma\schema.prisma" -Force

# Générer et appliquer la migration
cd apps\api
npx prisma migrate dev --name syscohada_2025_full_compliance
npx prisma generate
cd ..\..
```

#### Étape 3 : Migration des Données

```powershell
psql -U postgres -d aicompta -f .\migration\migrate-data.sql
```

#### Étape 4 : Redémarrage

```powershell
cd apps\api
npm run dev
```

---

## 🔍 Vérification Post-Migration

### 1. Vérifier les Nouvelles Tables

```sql
-- Se connecter à la base
psql -U postgres -d aicompta

-- Vérifier les tables
\dt

-- Vous devriez voir :
-- - AccountingPeriod
-- - JournalSequence
-- - ExchangeRate
-- - ExchangeDifference
```

### 2. Vérifier les Données Migrées

```sql
-- Comptes avec classification SYSCOHADA
SELECT code, label, class, "normalBalance"
FROM "ChartOfAccount"
WHERE class IS NOT NULL
LIMIT 10;

-- Écritures avec statut
SELECT reference, date, status, "sequenceNumber"
FROM "JournalEntry"
LIMIT 10;

-- Périodes comptables
SELECT name, "startDate", "endDate", status
FROM "AccountingPeriod"
ORDER BY "startDate";

-- Séquences de numérotation
SELECT journal, prefix, "currentNumber", year
FROM "JournalSequence";
```

### 3. Tester l'Application

1. **Démarrer l'API**
   ```powershell
   cd apps\api
   npm run dev
   ```

2. **Démarrer le Frontend**
   ```powershell
   cd apps\web
   npm run dev
   ```

3. **Tests à effectuer** :
   - ✅ Créer une écriture en brouillard
   - ✅ Valider une écriture
   - ✅ Vérifier la numérotation (ACH-2025-00001)
   - ✅ Consulter le bilan
   - ✅ Consulter la balance
   - ✅ Uploader une facture

---

## 🆘 En Cas de Problème

### Restauration du Backup

Si la migration échoue, vous pouvez restaurer le backup :

```powershell
# Trouver le fichier de backup
ls .\migration\backups\

# Restaurer (remplacer TIMESTAMP par la date du backup)
psql -U postgres -d aicompta -f .\migration\backups\aicompta_pre_syscohada_2025_TIMESTAMP.sql
```

### Restauration du Schéma Prisma

```powershell
# Trouver le schéma sauvegardé
ls .\apps\api\prisma\schema-old-*.prisma

# Restaurer (remplacer TIMESTAMP)
Copy-Item ".\apps\api\prisma\schema-old-TIMESTAMP.prisma" ".\apps\api\prisma\schema.prisma" -Force

# Régénérer le client
cd apps\api
npx prisma generate
cd ..\..
```

### Erreurs Courantes

#### 1. `pg_dump: command not found`

**Solution** : Ajouter PostgreSQL au PATH
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
```

#### 2. `psql: FATAL: password authentication failed`

**Solution** : Vérifier les credentials PostgreSQL dans `.env`

#### 3. `Prisma migrate failed`

**Solution** : Vérifier que la base de données est accessible et que l'API est arrêtée

#### 4. Erreurs TypeScript après migration

**Solution** : Régénérer le client Prisma
```powershell
cd apps\api
npx prisma generate
cd ..\..
```

---

## 📊 Statistiques de Migration

Après une migration réussie, vous devriez avoir :

- ✅ **4 nouvelles tables** (AccountingPeriod, JournalSequence, ExchangeRate, ExchangeDifference)
- ✅ **~15 nouveaux champs** répartis sur les tables existantes
- ✅ **120 comptes SYSCOHADA** (si seed exécuté)
- ✅ **Périodes comptables** créées pour chaque exercice
- ✅ **Séquences de numérotation** initialisées (5 par exercice)
- ✅ **Références générées** pour toutes les écritures existantes

---

## 📞 Support

En cas de problème, consultez :

1. **Documentation complète** : `MIGRATION_SYSCOHADA_2025.md`
2. **Résumé de la refonte** : `REFONTE_SYSCOHADA_2025_RESUME.md`
3. **Plan comptable** : `PLAN_COMPTABLE_SYSCOHADA_2025.md`

---

## ✅ Checklist Post-Migration

- [ ] Backup créé et vérifié
- [ ] Nouveau schéma appliqué
- [ ] Données migrées
- [ ] Nouvelles tables créées
- [ ] Client Prisma régénéré
- [ ] API redémarrée sans erreur
- [ ] Frontend redémarré sans erreur
- [ ] Écriture de test créée
- [ ] Numérotation vérifiée (ACH-2025-00001)
- [ ] Bilan affiché correctement
- [ ] Balance affichée correctement
- [ ] Plan comptable SYSCOHADA chargé (si nouvelle org)

---

**🎉 Félicitations ! Votre application est maintenant 100% conforme SYSCOHADA 2025 !**
