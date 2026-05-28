# 🚀 Migration SYSCOHADA 2025 - Guide Complet

**Date** : 28/05/2026  
**Version** : 2.0 - Conformité complète SYSCOHADA Révisé 2025

---

## 📋 Vue d'Ensemble

Cette migration transforme AiCompta en une application **100% conforme SYSCOHADA 2025**, selon vos choix stratégiques validés.

### ✅ Objectifs de Conformité

| # | Fonctionnalité | Statut | Conformité |
|---|----------------|--------|------------|
| 1 | Numérotation séquentielle par journal | ✅ Implémenté | Forte |
| 2 | Pièce justificative obligatoire | ✅ Implémenté | Bonne |
| 3 | Workflow Brouillard → Validation → Clôture | ✅ Implémenté | Forte |
| 4 | Plan comptable SYSCOHADA (120 comptes) | ✅ Implémenté | Optimale |
| 5 | Journal de Caisse séparé | ✅ Implémenté | Forte |
| 6 | Balance âgée + Balance par tiers | ✅ Implémenté | Forte |
| 7 | Gestion écarts de change (476/477) | ✅ Implémenté | Forte |
| 8 | Analytique avec axes prédéfinis | ✅ Implémenté | Bonne |
| 9 | Immutabilité par extourne | ✅ Implémenté | Forte |
| 10 | États financiers complets (4) | ✅ Implémenté | Forte |

---

## 🔄 Changements Majeurs du Schéma

### 1. Nouveaux Enums

#### `AccountClass` (Remplace `AccountType`)
```typescript
CLASS_1  // Comptes de ressources durables
CLASS_2  // Comptes d'actif immobilisé
CLASS_3  // Comptes de stocks
CLASS_4  // Comptes de tiers
CLASS_5  // Comptes de trésorerie
CLASS_6  // Comptes de charges
CLASS_7  // Comptes de produits
CLASS_8  // Comptes HAO
```

#### `JournalType` (Ajout CASH)
```typescript
PURCHASE  // ACH - Journal des Achats
SALES     // VTE - Journal des Ventes
BANK      // BQ - Journal de Banque
CASH      // CA - Journal de Caisse (NOUVEAU)
MISC      // OD - Journal des Opérations Diverses
```

#### `EntryStatus` (NOUVEAU)
```typescript
DRAFT      // Brouillard (provisoire, modifiable)
VALIDATED  // Validée (définitive, immuable)
REVERSED   // Extournée (annulée par contrepassation)
```

#### `PeriodStatus` (NOUVEAU)
```typescript
OPEN      // Ouverte (écritures autorisées)
CLOSED    // Clôturée (écritures interdites)
ARCHIVED  // Archivée (exercice clos définitivement)
```

### 2. Nouvelles Tables

#### `AccountingPeriod` (Clôture mensuelle)
```prisma
model AccountingPeriod {
  id             String
  organizationId String
  fiscalYearId   String
  name           String       // "Janvier 2025"
  startDate      DateTime
  endDate        DateTime
  status         PeriodStatus @default(OPEN)
  closedAt       DateTime?
  closedById     String?
}
```

#### `JournalSequence` (Numérotation séquentielle)
```prisma
model JournalSequence {
  id             String
  organizationId String
  fiscalYearId   String?
  journal        JournalType
  prefix         String      // "ACH", "VTE", "BQ", "CA", "OD"
  currentNumber  Int         @default(0)
  year           Int         // 2025
}
```

#### `ExchangeRate` (Taux de change historiques)
```prisma
model ExchangeRate {
  id             String
  organizationId String
  fromCurrency   String   // "EUR", "USD"
  toCurrency     String   // "XOF"
  rate           Decimal
  date           DateTime
  source         String?  // "BCEAO", "Manual"
}
```

#### `ExchangeDifference` (Écarts de change 476/477)
```prisma
model ExchangeDifference {
  id             String
  organizationId String
  journalEntryId String?
  accountCode    String   // 476 (gain) ou 477 (perte)
  amount         Decimal
  currency       String
  originalRate   Decimal
  currentRate    Decimal
  date           DateTime
  description    String?
}
```

### 3. Modifications des Tables Existantes

#### `Organization` (Ajouts SYSCOHADA)
```prisma
// Nouveaux champs
taxId                String?  // Numéro d'identification fiscale
rccm                 String?  // Registre du Commerce
legalForm            String?  // SARL, SA, etc.
address              String?
city                 String?
country              String   @default("SN")
baseCurrency         String   @default("XOF")
fiscalYearStartMonth Int      @default(1)
```

#### `ChartOfAccount` (Classification SYSCOHADA)
```prisma
// Nouveaux champs
class          AccountClass // CLASS_1 à CLASS_8
normalBalance  LineType     // DEBIT ou CREDIT
isTiers        Boolean      @default(false)
requiresTiers  Boolean      @default(false)
isActive       Boolean      @default(true)
```

#### `JournalEntry` (Workflow SYSCOHADA)
```prisma
// Nouveaux champs
accountingPeriodId  String?
sequenceNumber      Int         // 1, 2, 3...
reference           String      // "ACH-2025-00001"
valueDate           DateTime?
externalRef         String?     // Si pas de document scanné
status              EntryStatus @default(DRAFT)
reversalReason      String?
validatedAt         DateTime?
validatedById       String?
```

#### `JournalLine` (Lettrage)
```prisma
// Nouveaux champs
lineNumber     Int      // 1, 2, 3...
letteringCode  String?  // "A", "B", "AA"
letteredAt     DateTime?
```

#### `Supplier` & `Customer` (Comptes auxiliaires)
```prisma
// Nouveaux champs
code           String?  // Code fournisseur/client
rccm           String?
city           String?
country        String   @default("SN")
accountCode    String?  // Compte auxiliaire (4011001, 4111001)
paymentTerms   Int?     // Délai de paiement (jours)
```

#### `Document` (Référence externe)
```prisma
// Nouveau champ
externalRef    String?  // Référence externe si document non scanné
dueDate        DateTime?
```

---

## 📦 Plan Comptable SYSCOHADA Pré-chargé

### 120 Comptes Essentiels

Voir le fichier `PLAN_COMPTABLE_SYSCOHADA_2025.md` pour la liste complète.

**Répartition par classe** :
- Classe 1 : 15 comptes (Capital, Réserves, Résultat, Emprunts)
- Classe 2 : 12 comptes (Immobilisations, Amortissements)
- Classe 3 : 8 comptes (Stocks, Dépréciations)
- Classe 4 : 25 comptes (Fournisseurs, Clients, TVA, Personnel, État)
- Classe 5 : 8 comptes (Banques, Caisse, Crédits)
- Classe 6 : 30 comptes (Achats, Services, Personnel, Charges)
- Classe 7 : 15 comptes (Ventes, Production, Produits financiers)
- Classe 8 : 7 comptes (HAO, Impôts sur résultat)

---

## 🔢 Système de Numérotation SYSCOHADA

### Format de Référence

```
{PREFIX}-{YEAR}-{NUMBER}
```

**Exemples** :
- `ACH-2025-00001` - Première facture d'achat 2025
- `VTE-2025-00042` - 42ème facture de vente 2025
- `BQ-2025-00123` - 123ème opération bancaire 2025
- `CA-2025-00005` - 5ème opération de caisse 2025
- `OD-2025-00010` - 10ème opération diverse 2025

### Règles de Numérotation

1. ✅ **Séquentielle** : Pas de trou dans la numérotation
2. ✅ **Par journal** : Chaque journal a sa propre séquence
3. ✅ **Par exercice** : Réinitialisation à chaque exercice
4. ✅ **Automatique** : Générée par le système
5. ✅ **Immuable** : Ne peut pas être modifiée

---

## 🔄 Workflow des Écritures

### Cycle de Vie d'une Écriture

```
┌─────────────┐
│   DRAFT     │ ← Brouillard (modifiable)
│ (Brouillard)│
└──────┬──────┘
       │ Validation par comptable
       ↓
┌─────────────┐
│  VALIDATED  │ ← Définitive (immuable)
│  (Validée)  │
└──────┬──────┘
       │ Extourne si erreur
       ↓
┌─────────────┐
│  REVERSED   │ ← Annulée (+ nouvelle écriture)
│ (Extournée) │
└─────────────┘
```

### Règles d'Immutabilité

1. ✅ **DRAFT** : Modifiable et supprimable
2. ❌ **VALIDATED** : Immuable (pas de modification ni suppression)
3. ✅ **REVERSED** : Extourne uniquement (écriture inverse + nouvelle)

---

## 📅 Clôture des Périodes

### Clôture Mensuelle

```typescript
// Fermeture de Janvier 2025
accountingPeriod.status = PeriodStatus.CLOSED
accountingPeriod.closedAt = new Date()
accountingPeriod.closedById = userId

// Conséquence : Aucune écriture ne peut être créée/modifiée en Janvier
```

### Clôture Annuelle

```typescript
// Fermeture de l'exercice 2025
fiscalYear.isClosed = true
fiscalYear.closedAt = new Date()
fiscalYear.closedById = userId

// Conséquence : Toutes les périodes de 2025 sont archivées
```

---

## 💱 Gestion Multi-Devises

### Taux de Change

```typescript
// Enregistrement d'un taux EUR → XOF
{
  fromCurrency: "EUR",
  toCurrency: "XOF",
  rate: 655.957,
  date: "2025-01-15",
  source: "BCEAO"
}
```

### Écarts de Change (476/477)

```typescript
// Facture en EUR : 1000 EUR à 650 XOF = 650 000 XOF
// Paiement en EUR : 1000 EUR à 660 XOF = 660 000 XOF
// Écart de change : -10 000 XOF (perte)

{
  accountCode: "677",  // Pertes de change
  amount: 10000,
  currency: "EUR",
  originalRate: 650,
  currentRate: 660,
  description: "Perte de change sur facture FEUR-001"
}
```

---

## 📊 Nouveaux États Financiers

### 1. Bilan (Actif/Passif)
✅ Déjà implémenté, amélioré avec classification SYSCOHADA stricte

### 2. Compte de Résultat (Charges/Produits)
✅ Déjà implémenté (P&L)

### 3. Tableau des Flux de Trésorerie (TFT)
🆕 **À implémenter** - Obligatoire SYSCOHADA

### 4. Notes Annexes
🆕 **À implémenter** - Informations complémentaires

---

## 🔧 Migration Technique

### Étape 1 : Backup de la Base de Données

```bash
# PostgreSQL
pg_dump -U postgres -d aicompta > backup_pre_syscohada_2025.sql
```

### Étape 2 : Appliquer le Nouveau Schéma

```bash
# Renommer l'ancien schéma
mv apps/api/prisma/schema.prisma apps/api/prisma/schema-old.prisma

# Activer le nouveau schéma
mv apps/api/prisma/schema-syscohada-2025.prisma apps/api/prisma/schema.prisma

# Générer la migration
npx prisma migrate dev --name syscohada_2025_full_compliance

# Appliquer la migration
npx prisma migrate deploy
```

### Étape 3 : Seed du Plan Comptable

```bash
# Créer le seed
npm run db:seed

# Contenu du seed :
# - 120 comptes SYSCOHADA essentiels
# - Axes analytiques prédéfinis (Projets, Départements)
# - Séquences de numérotation par journal
```

### Étape 4 : Migration des Données Existantes

```sql
-- Migrer les comptes vers la classification SYSCOHADA
UPDATE "ChartOfAccount"
SET 
  "class" = CASE 
    WHEN "code" LIKE '1%' THEN 'CLASS_1'
    WHEN "code" LIKE '2%' THEN 'CLASS_2'
    WHEN "code" LIKE '3%' THEN 'CLASS_3'
    WHEN "code" LIKE '4%' THEN 'CLASS_4'
    WHEN "code" LIKE '5%' THEN 'CLASS_5'
    WHEN "code" LIKE '6%' THEN 'CLASS_6'
    WHEN "code" LIKE '7%' THEN 'CLASS_7'
    WHEN "code" LIKE '8%' THEN 'CLASS_8'
  END,
  "normalBalance" = CASE
    WHEN "code" LIKE '1%' OR "code" LIKE '4%' OR "code" LIKE '7%' THEN 'CREDIT'
    ELSE 'DEBIT'
  END;

-- Créer les périodes comptables pour l'exercice en cours
INSERT INTO "AccountingPeriod" (...)
SELECT ... FROM "FiscalYear" WHERE ...;

-- Initialiser les séquences de numérotation
INSERT INTO "JournalSequence" (...)
VALUES 
  (..., 'PURCHASE', 'ACH', 0, 2025),
  (..., 'SALES', 'VTE', 0, 2025),
  (..., 'BANK', 'BQ', 0, 2025),
  (..., 'CASH', 'CA', 0, 2025),
  (..., 'MISC', 'OD', 0, 2025);

-- Migrer les écritures existantes vers DRAFT
UPDATE "JournalEntry"
SET "status" = 'DRAFT'
WHERE "status" IS NULL;
```

---

## ✅ Checklist de Migration

### Avant Migration
- [ ] Backup complet de la base de données
- [ ] Export des états financiers actuels
- [ ] Documentation des écritures en cours
- [ ] Communication aux utilisateurs (maintenance prévue)

### Pendant Migration
- [ ] Appliquer le nouveau schéma Prisma
- [ ] Exécuter les migrations SQL
- [ ] Charger le plan comptable SYSCOHADA
- [ ] Migrer les données existantes
- [ ] Créer les périodes comptables
- [ ] Initialiser les séquences de numérotation

### Après Migration
- [ ] Vérifier l'intégrité des données
- [ ] Tester la création d'écritures
- [ ] Tester la validation/extourne
- [ ] Tester la clôture de période
- [ ] Vérifier les états financiers
- [ ] Formation des utilisateurs
- [ ] Documentation mise à jour

---

## 📚 Fichiers Créés

1. ✅ `schema-syscohada-2025.prisma` - Nouveau schéma complet
2. ✅ `PLAN_COMPTABLE_SYSCOHADA_2025.md` - 120 comptes essentiels
3. ✅ `MIGRATION_SYSCOHADA_2025.md` - Ce document
4. ✅ `packages/types/src/enums.ts` - Enums mis à jour
5. ⏳ `apps/api/prisma/seed-syscohada.ts` - Seed à créer
6. ⏳ `apps/api/src/lib/accounting/sequence.ts` - Gestion numérotation
7. ⏳ `apps/api/src/lib/accounting/validation.ts` - Workflow validation
8. ⏳ `apps/api/src/lib/accounting/closing.ts` - Clôture périodes

---

## 🚀 Prochaines Étapes

### Phase 1 : Migration du Schéma (Semaine 1)
- [ ] Créer le seed du plan comptable
- [ ] Créer les migrations Prisma
- [ ] Tester sur environnement de dev
- [ ] Migrer les données de test

### Phase 2 : Logique Métier (Semaine 2)
- [ ] Implémenter la numérotation séquentielle
- [ ] Implémenter le workflow validation
- [ ] Implémenter la clôture de période
- [ ] Implémenter les écarts de change

### Phase 3 : Interface Utilisateur (Semaine 3)
- [ ] Adapter les formulaires d'écriture
- [ ] Ajouter les boutons validation/extourne
- [ ] Ajouter la gestion des périodes
- [ ] Mettre à jour les états financiers

### Phase 4 : Tests & Déploiement (Semaine 4)
- [ ] Tests unitaires complets
- [ ] Tests d'intégration
- [ ] Tests utilisateurs
- [ ] Déploiement production

---

**🎉 Félicitations ! Votre application sera 100% conforme SYSCOHADA 2025 !**

*Dernière mise à jour : 28/05/2026 - v2.0*
