# 📝 Phase 3 : Adaptation du Code - SYSCOHADA 2025

**Date** : 28/05/2026  
**Statut** : ✅ En cours

---

## 🎯 Objectif

Adapter le code existant pour utiliser les nouvelles fonctionnalités SYSCOHADA 2025 :
- Numérotation séquentielle automatique
- Workflow de validation (Brouillard → Validation → Extourne)
- Clôture des périodes comptables
- Affichage des statuts dans l'interface

---

## ✅ Fichiers Modifiés

### 1. Backend - Logique Métier

#### `apps/api/src/lib/accounting/journal.ts` ✅

**Modifications** :
- ✅ Import de `getNextSequenceNumber`
- ✅ Ajout du paramètre `fiscalYearId` aux fonctions de construction
- ✅ Génération automatique des références SYSCOHADA (ACH-2025-00001)
- ✅ Ajout du champ `status: 'DRAFT'` par défaut
- ✅ Ajout du champ `externalRef` pour la référence externe
- ✅ Support du journal `CASH` pour les notes de frais
- ✅ Ajout des champs `sequenceNumber` et `status` à `BuiltEntry`

**Exemple** :
```typescript
// Avant
return {
  reference: doc.invoiceNumber ?? `ACH-${doc.id.slice(0, 8)}`,
  ...
};

// Après
if (fiscalYearId) {
  const seq = await getNextSequenceNumber(orgId, fiscalYearId, 'PURCHASE');
  reference = seq.reference; // "ACH-2025-00001"
  sequenceNumber = seq.sequenceNumber; // 1
}

return {
  reference,
  externalRef: doc.invoiceNumber,
  sequenceNumber,
  status: 'DRAFT',
  ...
};
```

### 2. Backend - Routes API

#### `apps/api/src/routes/journal-entries.ts` ✅ NOUVEAU

**Endpoints créés** :

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/journal-entries/:id/validate` | Valide une écriture en brouillard |
| `POST` | `/api/journal-entries/:id/reverse` | Extourne une écriture validée |
| `GET` | `/api/journal-entries/:id/permissions` | Obtient les permissions |
| `GET` | `/api/journal-entries/draft` | Liste les écritures en brouillard |
| `GET` | `/api/journal-entries/validated` | Liste les écritures validées |
| `GET` | `/api/journal-entries/stats` | Statistiques par statut |

**Exemple d'utilisation** :
```typescript
// Valider une écriture
POST /api/journal-entries/abc123/validate
→ { success: true, entry: { status: 'VALIDATED', validatedAt: '...', ... } }

// Extourner une écriture
POST /api/journal-entries/abc123/reverse
Body: { reason: "Erreur de saisie" }
→ { success: true, reversalEntry: { reference: "CP-ACH-2025-00001", ... } }
```

#### `apps/api/src/routes/accounting-periods.ts` ✅ NOUVEAU

**Endpoints créés** :

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/accounting-periods` | Liste les périodes |
| `GET` | `/api/accounting-periods/current` | Période ouverte actuelle |
| `POST` | `/api/accounting-periods/:id/close` | Clôture mensuelle |
| `POST` | `/api/accounting-periods/:id/reopen` | Réouverture (OWNER only) |
| `GET` | `/api/accounting-periods/:id/stats` | Statistiques de période |
| `POST` | `/api/fiscal-years/:id/close` | Clôture annuelle |
| `GET` | `/api/fiscal-years/:id/closing-status` | Statut de clôture |

**Exemple d'utilisation** :
```typescript
// Clôturer une période
POST /api/accounting-periods/period123/close
→ { success: true, period: { status: 'CLOSED', closedAt: '...', ... } }

// Vérifier le statut de clôture annuelle
GET /api/fiscal-years/fy2025/closing-status
→ {
  isClosed: false,
  totalPeriods: 12,
  closedPeriods: 11,
  openPeriods: 1,
  draftEntries: 3,
  canClose: false,
  blockingReasons: ["1 période(s) ouverte(s)", "3 écriture(s) en brouillard"]
}
```

---

## 📋 Fichiers à Créer (Frontend)

### 1. Composants UI

#### `apps/web/src/components/journal/EntryStatusBadge.tsx` ⏳

Badge pour afficher le statut d'une écriture :
```tsx
<EntryStatusBadge status="DRAFT" />     // 🟡 Brouillard
<EntryStatusBadge status="VALIDATED" /> // 🟢 Validée
<EntryStatusBadge status="REVERSED" />  // 🔴 Extournée
```

#### `apps/web/src/components/journal/EntryActions.tsx` ⏳

Boutons d'action selon le statut :
```tsx
<EntryActions 
  entry={entry}
  onValidate={() => ...}
  onReverse={() => ...}
/>
// Affiche : [Valider] si DRAFT
// Affiche : [Extourner] si VALIDATED
```

#### `apps/web/src/components/periods/PeriodStatusBadge.tsx` ⏳

Badge pour afficher le statut d'une période :
```tsx
<PeriodStatusBadge status="OPEN" />     // 🟢 Ouverte
<PeriodStatusBadge status="CLOSED" />   // 🔴 Clôturée
<PeriodStatusBadge status="ARCHIVED" /> // ⚫ Archivée
```

#### `apps/web/src/components/periods/ClosingDialog.tsx` ⏳

Dialog de confirmation pour la clôture :
```tsx
<ClosingDialog
  period={period}
  onConfirm={() => closePeriod(period.id)}
/>
```

### 2. Pages Mises à Jour

#### `apps/web/src/app/(app)/journal/page.tsx` ⏳

**Modifications nécessaires** :
- ✅ Afficher le statut de chaque écriture (badge)
- ✅ Afficher la référence SYSCOHADA (ACH-2025-00001)
- ✅ Boutons d'action conditionnels (Valider/Extourner)
- ✅ Filtre par statut (Brouillard / Validées / Extournées)
- ✅ Indicateur de période ouverte/fermée

**Mockup** :
```
┌─────────────────────────────────────────────────────────────┐
│ Journal des Écritures                    [Période: Jan 2025]│
│                                          [🟢 Ouverte]        │
├─────────────────────────────────────────────────────────────┤
│ Filtres: [Toutes] [Brouillard] [Validées] [Extournées]     │
├─────────────────────────────────────────────────────────────┤
│ Réf.            │ Date       │ Description  │ Statut │ Actions│
├─────────────────┼────────────┼──────────────┼────────┼────────┤
│ ACH-2025-00001  │ 15/01/2025 │ Facture F001 │ 🟡 Brouillard │ [Valider]│
│ ACH-2025-00002  │ 16/01/2025 │ Facture F002 │ 🟢 Validée    │ [Extourner]│
│ VTE-2025-00001  │ 17/01/2025 │ Facture V001 │ 🟢 Validée    │ [Extourner]│
└─────────────────────────────────────────────────────────────┘
```

#### `apps/web/src/app/(app)/settings/periods/page.tsx` ⏳ NOUVEAU

Page de gestion des périodes comptables :
```
┌─────────────────────────────────────────────────────────────┐
│ Gestion des Périodes Comptables - Exercice 2025            │
├─────────────────────────────────────────────────────────────┤
│ Période       │ Dates           │ Statut      │ Écritures │ Actions│
├───────────────┼─────────────────┼─────────────┼───────────┼────────┤
│ Janvier 2025  │ 01/01 - 31/01   │ 🔴 Clôturée │ 45        │ [Réouvrir]│
│ Février 2025  │ 01/02 - 29/02   │ 🔴 Clôturée │ 38        │ [Réouvrir]│
│ Mars 2025     │ 01/03 - 31/03   │ 🟢 Ouverte  │ 12 (3 🟡) │ [Clôturer]│
│ Avril 2025    │ 01/04 - 30/04   │ ⚪ Future   │ 0         │ -      │
├─────────────────────────────────────────────────────────────┤
│ Clôture annuelle: [Clôturer l'exercice 2025]               │
│ ⚠️ 1 période ouverte, 3 écritures en brouillard            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Modifications à Apporter

### 1. Mise à Jour des Appels API

**Fichier** : `apps/api/src/routes/documents.ts`

Actuellement :
```typescript
const entry = await buildPurchaseInvoiceEntry(extracted, docContext, orgId);
```

À modifier :
```typescript
// Récupérer l'exercice fiscal actif
const fiscalYear = await prisma.fiscalYear.findFirst({
  where: {
    organizationId: orgId,
    isClosed: false,
  },
});

const entry = await buildPurchaseInvoiceEntry(
  extracted,
  docContext,
  orgId,
  fiscalYear?.id // Génère la numérotation SYSCOHADA
);
```

### 2. Mise à Jour du Schéma de Création

**Fichier** : `apps/api/src/routes/documents.ts`

Ajouter les nouveaux champs lors de la création :
```typescript
await prisma.journalEntry.create({
  data: {
    organizationId: orgId,
    fiscalYearId: entry.fiscalYearId,
    accountingPeriodId: currentPeriod.id, // Période actuelle
    journal: entry.journal,
    sequenceNumber: entry.sequenceNumber, // Nouveau
    reference: entry.reference,
    date: entry.date,
    description: entry.description,
    documentId: entry.documentId,
    externalRef: entry.externalRef, // Nouveau
    status: entry.status, // Nouveau (DRAFT)
    createdById: userId,
    lines: {
      create: entry.lines.map((line, index) => ({
        organizationId: orgId,
        lineNumber: index + 1, // Nouveau
        accountCode: line.accountCode,
        accountLabel: line.accountLabel,
        lineType: line.lineType,
        amount: line.amount,
        currency: line.currency,
        fxRate: line.fxRate,
        amountXof: line.amountXof,
        description: line.description,
        supplierId: line.supplierId,
        customerId: line.customerId,
      })),
    },
  },
});
```

---

## 📊 Workflow Utilisateur

### Scénario 1 : Création et Validation d'une Écriture

1. **Upload de facture** → Écriture créée en `DRAFT` avec référence `ACH-2025-00001`
2. **Vérification** → Utilisateur consulte l'écriture dans le journal
3. **Validation** → Clic sur [Valider] → Statut passe à `VALIDATED`
4. **Immutabilité** → L'écriture ne peut plus être modifiée ni supprimée

### Scénario 2 : Correction d'une Écriture Validée

1. **Erreur détectée** → Écriture `ACH-2025-00001` validée par erreur
2. **Extourne** → Clic sur [Extourner] → Saisie de la raison
3. **Création** → Écriture `CP-ACH-2025-00001` créée (inverse)
4. **Nouvelle écriture** → Création de `ACH-2025-00002` (correcte)

### Scénario 3 : Clôture Mensuelle

1. **Validation** → Toutes les écritures du mois sont validées
2. **Vérification** → Aucune écriture en brouillard
3. **Clôture** → Clic sur [Clôturer Janvier 2025]
4. **Blocage** → Plus aucune écriture ne peut être créée en Janvier

### Scénario 4 : Clôture Annuelle

1. **Toutes les périodes clôturées** → 12/12 périodes fermées
2. **Aucune écriture en brouillard** → Vérification globale
3. **Clôture** → Clic sur [Clôturer l'exercice 2025]
4. **Archivage** → Toutes les périodes passent en `ARCHIVED`

---

## ✅ Checklist d'Implémentation

### Backend ✅
- [x] Adapter `journal.ts` pour la numérotation séquentielle
- [x] Créer les routes `/journal-entries/*`
- [x] Créer les routes `/accounting-periods/*`
- [ ] Mettre à jour `/documents.ts` pour utiliser `fiscalYearId`
- [ ] Ajouter les nouveaux champs dans les créations d'écritures

### Frontend ⏳
- [ ] Créer `EntryStatusBadge.tsx`
- [ ] Créer `EntryActions.tsx`
- [ ] Créer `PeriodStatusBadge.tsx`
- [ ] Créer `ClosingDialog.tsx`
- [ ] Mettre à jour `journal/page.tsx`
- [ ] Créer `settings/periods/page.tsx`
- [ ] Ajouter les filtres par statut
- [ ] Ajouter les indicateurs de période

### Tests ⏳
- [ ] Tester la validation d'écriture
- [ ] Tester l'extourne d'écriture
- [ ] Tester la clôture de période
- [ ] Tester la clôture annuelle
- [ ] Tester les permissions

---

## 🚀 Prochaines Étapes

1. **Terminer le frontend** (composants + pages)
2. **Mettre à jour les routes existantes** (documents.ts)
3. **Tester le workflow complet**
4. **Documenter les API**
5. **Former les utilisateurs**

---

**📝 Note** : Les erreurs de lint TypeScript actuelles sont normales et disparaîtront après l'exécution de la migration (Phase 2).

*Dernière mise à jour : 28/05/2026*
