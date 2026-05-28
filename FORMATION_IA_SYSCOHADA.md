# Formation IA - Règles SYSCOHADA Révisé 2025

## 📚 Contexte

Ce document contient les règles comptables SYSCOHADA Révisé 2025 intégrées dans le modèle IA d'extraction de factures.

**SYSCOHADA** = Système Comptable OHADA (Organisation pour l'Harmonisation en Afrique du Droit des Affaires)

**17 pays membres** : Sénégal, Côte d'Ivoire, Mali, Burkina Faso, Niger, Togo, Bénin, Guinée-Bissau, Cameroun, Gabon, Congo, RCA, RDC, Guinée Équatoriale, Tchad, Guinée.

**Version** : SYSCOHADA Révisé 2025 (Plan Comptable Annoté 2025)

## 🎯 Objectif

Former le modèle IA (Claude) à extraire correctement les données de factures selon les normes SYSCOHADA Révisé 2025.

## 📋 Règles SYSCOHADA pour Factures d'Achat

### Principe de la Partie Double

**Toute écriture comptable doit respecter : DÉBIT = CRÉDIT**

### Schéma d'Écriture - Facture d'Achat

```
┌─────────────────────────────────────────────────────────────┐
│                   FACTURE D'ACHAT SYSCOHADA                 │
├─────────────────────────────────────────────────────────────┤
│ DÉBIT  │ 60x ou 62x │ Achats                │ Montant HT   │
│ DÉBIT  │ 4452       │ TVA déductible        │ Montant TVA  │
│ CRÉDIT │ 401        │ Fournisseurs          │ Montant TTC  │
└─────────────────────────────────────────────────────────────┘

Équation : HT + TVA = TTC
Vérification : Total DÉBIT = Total CRÉDIT
```

### Plan Comptable SYSCOHADA - Classes 1 à 8

| Classe | Intitulé | Nature | Bilan/Gestion |
|--------|----------|--------|---------------|
| **1** | Comptes de ressources durables | Capitaux propres, Emprunts | Bilan (Passif) |
| **2** | Comptes d'actif immobilisé | Immobilisations | Bilan (Actif) |
| **3** | Comptes de stocks | Marchandises, Matières | Bilan (Actif) |
| **4** | Comptes de tiers | Fournisseurs, Clients, TVA | Bilan (Actif/Passif) |
| **5** | Comptes de trésorerie | Banques, Caisse | Bilan (Actif) |
| **6** | Comptes de charges | Achats, Services, Personnel | Gestion (Charges) |
| **7** | Comptes de produits | Ventes, Production | Gestion (Produits) |
| **8** | Autres charges et produits | HAO, Cessions | Gestion (HAO) |

### Comptes Critiques pour Factures d'Achat

#### Classe 4 - Comptes de Tiers

| Compte | Intitulé | Sens Normal | Usage |
|--------|----------|-------------|-------|
| **401** | Fournisseurs, dettes en compte | **CRÉDIT** | Montant TTC de la facture |
| **4452** | État, TVA récupérable sur achats | **DÉBIT** | Montant de la TVA |
| **411** | Clients | DÉBIT | Créances clients |
| **4431** | État, TVA facturée sur ventes | CRÉDIT | TVA collectée |

#### Classe 6 - Comptes de Charges

| Compte | Intitulé | Type d'achat |
|--------|----------|--------------|
| **601** | Achats de marchandises | Biens destinés à la revente |
| **602** | Achats de matières premières | Matières pour production |
| **604** | Achats stockés de matières consommables | Fournitures stockées |
| **605** | Autres achats | Eau, électricité, petit matériel |
| **621** | Sous-traitance générale | Services sous-traités |
| **622** | Locations et charges locatives | Loyers |
| **624** | Entretien, réparations et maintenance | Maintenance |
| **625** | Primes d'assurance | Assurances |
| **626** | Études, recherches et documentation | Études |
| **627** | Publicité, publications | Marketing |

### Règle de Classification des Comptes

**Comptes de Bilan** :
- Classe 1 : **Passif** (ressources)
- Classe 2 : **Actif** (immobilisations)
- Classe 3 : **Actif** (stocks)
- Classe 4 : **Actif ou Passif** selon le compte
  - 401-408 (Fournisseurs) : **TOUJOURS Passif**
  - 411-419 (Clients) : **TOUJOURS Actif**
  - 4452 (TVA déductible) : **Actif**
  - 4431 (TVA collectée) : **Passif**
- Classe 5 : **Actif** (trésorerie)

**Comptes de Gestion** :
- Classe 6 : **Charges** (diminuent le résultat)
- Classe 7 : **Produits** (augmentent le résultat)

## ✅ Règles de Validation

### 1. Cohérence des Montants

```
✓ CORRECT :
  HT = 100 000 XOF
  TVA = 18 000 XOF (18%)
  TTC = 118 000 XOF
  → 100 000 + 18 000 = 118 000 ✓

✗ INCORRECT :
  HT = 100 000 XOF
  TVA = 18 000 XOF
  TTC = 100 000 XOF
  → 100 000 + 18 000 ≠ 100 000 ✗
```

### 2. Montants Positifs

**Tous les montants doivent être positifs (> 0)**

- ✓ HT = 100 000 XOF
- ✗ HT = -100 000 XOF (IMPOSSIBLE pour un achat)

### 3. TVA Standard

En zone OHADA, la TVA standard est généralement **18%**

### 4. Devise

- **XOF** : Franc CFA (FCFA, F CFA)
- **EUR** : Euro
- **USD** : Dollar américain

## 🔍 Exemples d'Extraction

### Exemple 1 : Facture Simple

**Facture :**
```
FACTURE N° 2024-001
Date : 15/01/2024
Fournisseur : SARL DISTRIBUTION CI

Marchandises : 100 000 F CFA
TVA 18% : 18 000 F CFA
TOTAL TTC : 118 000 F CFA
```

**Extraction JSON :**
```json
{
  "invoiceNumber": "2024-001",
  "invoiceDate": "2024-01-15",
  "dueDate": null,
  "supplierName": "SARL DISTRIBUTION CI",
  "supplierTaxId": null,
  "totalHT": 100000,
  "totalTVA": 18000,
  "totalTTC": 118000,
  "currency": "XOF",
  "items": [
    {
      "description": "Marchandises",
      "quantity": 1,
      "unitPrice": 100000,
      "totalHT": 100000,
      "tvaRate": 18,
      "tvaAmount": 18000
    }
  ],
  "confidence": 0.95
}
```

### Exemple 2 : Facture Multi-Lignes

**Facture :**
```
FACTURE N° 2024-002
Date : 20/01/2024
Fournisseur : SI3D

Ligne 1 : Riz (10 sacs × 5 000) = 50 000 F CFA
Ligne 2 : Huile (5 bidons × 8 000) = 40 000 F CFA
Sous-total HT : 90 000 F CFA
TVA 18% : 16 200 F CFA
TOTAL TTC : 106 200 F CFA
```

**Extraction JSON :**
```json
{
  "invoiceNumber": "2024-002",
  "invoiceDate": "2024-01-20",
  "dueDate": null,
  "supplierName": "SI3D",
  "supplierTaxId": null,
  "totalHT": 90000,
  "totalTVA": 16200,
  "totalTTC": 106200,
  "currency": "XOF",
  "items": [
    {
      "description": "Riz",
      "quantity": 10,
      "unitPrice": 5000,
      "totalHT": 50000,
      "tvaRate": 18,
      "tvaAmount": 9000
    },
    {
      "description": "Huile",
      "quantity": 5,
      "unitPrice": 8000,
      "totalHT": 40000,
      "tvaRate": 18,
      "tvaAmount": 7200
    }
  ],
  "confidence": 0.95
}
```

## ⚠️ Erreurs Courantes à Éviter

### 1. Montants Négatifs
```json
// ✗ INCORRECT
{
  "totalHT": -100000,
  "totalTVA": -18000,
  "totalTTC": -118000
}

// ✓ CORRECT
{
  "totalHT": 100000,
  "totalTVA": 18000,
  "totalTTC": 118000
}
```

### 2. Incohérence HT + TVA ≠ TTC
```json
// ✗ INCORRECT
{
  "totalHT": 100000,
  "totalTVA": 18000,
  "totalTTC": 100000  // Erreur !
}

// ✓ CORRECT
{
  "totalHT": 100000,
  "totalTVA": 18000,
  "totalTTC": 118000  // 100000 + 18000
}
```

### 3. Somme des Items ≠ Total
```json
// ✗ INCORRECT
{
  "totalHT": 100000,
  "items": [
    { "totalHT": 50000 },
    { "totalHT": 30000 }  // 50000 + 30000 = 80000 ≠ 100000
  ]
}

// ✓ CORRECT
{
  "totalHT": 100000,
  "items": [
    { "totalHT": 60000 },
    { "totalHT": 40000 }  // 60000 + 40000 = 100000 ✓
  ]
}
```

## 📊 Score de Confiance

Le score de confiance reflète la qualité de l'extraction :

| Score | Signification |
|-------|---------------|
| **0.95-1.0** | Données parfaites, claires, cohérentes (HT+TVA=TTC vérifié) |
| **0.85-0.94** | Données complètes, quelques incertitudes mineures |
| **0.70-0.84** | Données partielles ou qualité moyenne |
| **< 0.70** | Données manquantes, incohérentes ou mauvaise qualité |

**Un score < 0.85 déclenche une vérification humaine obligatoire.**

## 🎓 Résumé pour l'IA

Lors de l'extraction d'une facture d'achat :

1. ✅ Extraire tous les montants en **valeurs positives**
2. ✅ Vérifier que **HT + TVA = TTC**
3. ✅ Vérifier que **Σ items.totalHT = totalHT**
4. ✅ Vérifier que **Σ items.tvaAmount = totalTVA**
5. ✅ Identifier clairement le **fournisseur**
6. ✅ Convertir FCFA/F CFA en **"XOF"**
7. ✅ Retourner un score de confiance **réaliste**
8. ✅ En cas d'incohérence, **ajuster les valeurs** et **réduire le score**

---

**Date de création** : 28/05/2026
**Dernière mise à jour** : 28/05/2026
**Version** : 2.0 - SYSCOHADA Révisé 2025 (Plan Comptable Annoté 2025)
