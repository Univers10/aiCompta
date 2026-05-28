# Cours de Comptabilité — SYSCOHADA
> Système Comptable OHADA · Applicable aux États membres de l'OHADA (Afrique de l'Ouest et Centrale)

---

## Table des matières

1. [Introduction au SYSCOHADA](#1-introduction-au-syscohada)
2. [Les Classes de Comptes](#2-les-classes-de-comptes)
3. [Règle fondamentale : Débit / Crédit](#3-règle-fondamentale--débit--crédit)
4. [Le Journal Comptable](#4-le-journal-comptable)
5. [Le Grand Livre](#5-le-grand-livre)
6. [La Balance des Comptes](#6-la-balance-des-comptes)
7. [Le Compte de Résultat](#7-le-compte-de-résultat)
8. [Le Bilan Comptable](#8-le-bilan-comptable)
9. [Processus Comptable Complet (Cycle)](#9-processus-comptable-complet-cycle)
10. [Ratios et Indicateurs Essentiels](#10-ratios-et-indicateurs-essentiels)

---

## 1. Introduction au SYSCOHADA

Le **SYSCOHADA** (Système Comptable OHADA) est le référentiel comptable applicable aux entreprises des États membres de l'Organisation pour l'Harmonisation en Afrique du Droit des Affaires (OHADA). Il remplace les anciens plans comptables nationaux et assure une harmonisation comptable dans 17 pays africains.

### Principes fondamentaux

- **Principe de continuité d'exploitation** : l'entreprise est présumée continuer ses activités
- **Principe de permanence des méthodes** : les méthodes comptables doivent rester stables d'un exercice à l'autre
- **Principe du coût historique** : les biens sont enregistrés à leur coût d'acquisition
- **Principe de prudence** : ne pas anticiper les profits, mais provisionner les risques
- **Principe de spécialisation des exercices** : chaque charge et produit est rattaché à l'exercice qui le concerne
- **Principe de transparence** : toutes les informations utiles doivent être communiquées

### Exercice comptable

L'exercice comptable dure **12 mois**, généralement du 1er janvier au 31 décembre.

---

## 2. Les Classes de Comptes

Le plan comptable SYSCOHADA est organisé en **9 classes** :

### Comptes de Bilan (Classes 1 à 5)

| Classe | Intitulé | Exemples de comptes |
|--------|----------|---------------------|
| **1** | Comptes de ressources durables | 101 Capital, 111 Réserves légales, 16 Emprunts, 12 Report à nouveau |
| **2** | Comptes d'actif immobilisé | 211 Terrains, 221 Bâtiments, 245 Matériel de transport, 26 Titres de participation |
| **3** | Comptes de stocks | 31 Marchandises, 32 Matières premières, 35 Stocks en cours, 36 Produits finis |
| **4** | Comptes de tiers | 401 Fournisseurs, 411 Clients, 421 Personnel, 44 État et collectivités |
| **5** | Comptes de trésorerie | 521 Banque, 571 Caisse, 51 Titres de placement, 585 Virements internes |

### Comptes de Gestion (Classes 6 à 8)

| Classe | Intitulé | Exemples de comptes |
|--------|----------|---------------------|
| **6** | Charges des activités ordinaires | 601 Achats marchands, 641 Salaires, 661 Intérêts, 681 Dotations amortissements |
| **7** | Produits des activités ordinaires | 701 Ventes marchandises, 706 Services vendus, 72 Production stockée, 77 Revenus financiers |
| **8** | Autres charges et produits (HAO) | 81 Valeurs comptables cessions, 82 Produits des cessions, 84 Produits HAO |

### Comptes Spéciaux (Classe 0)

| Classe | Intitulé | Exemples de comptes |
|--------|----------|---------------------|
| **0** | Engagements hors bilan | 01 Engagements donnés, 02 Engagements reçus, garanties, cautions |

---

## 3. Règle fondamentale : Débit / Crédit

### Le Compte en T

Chaque compte comptable est représenté sous forme de T :

```
          NOM DU COMPTE (N° Compte)
  ─────────────────────────────────────
        DÉBIT          |      CRÉDIT
  ─────────────────────|───────────────
  (augmentation actif) | (augmentation passif)
  (augmentation charge)| (augmentation produit)
  (diminution passif)  | (diminution actif)
  (diminution produit) | (diminution charge)
```

### Règles de jeu des comptes

| Type de compte | Au Débit | Au Crédit |
|----------------|----------|-----------|
| Actif (cl. 2, 3, 4, 5) | Augmentation ↑ | Diminution ↓ |
| Passif (cl. 1) | Diminution ↓ | Augmentation ↑ |
| Charges (cl. 6, 8 charges) | Augmentation ↑ | Diminution ↓ |
| Produits (cl. 7, 8 produits) | Diminution ↓ | Augmentation ↑ |

### Principe d'équilibre

> **Pour toute écriture comptable : Total Débit = Total Crédit**

C'est la **partie double** : tout emploi a une ressource correspondante.

---

## 4. Le Journal Comptable

### Définition

Le journal est le **livre comptable obligatoire** dans lequel toutes les opérations sont enregistrées **chronologiquement**, au fur et à mesure de leur réalisation. Chaque enregistrement s'appelle une **écriture comptable**.

### Structure d'une écriture

```
┌──────────┬──────────┬────────────────────────────┬─────────────┬─────────────┐
│  Date    │ N°Compte │       Intitulé              │   Débit     │   Crédit    │
├──────────┼──────────┼────────────────────────────┼─────────────┼─────────────┤
│ jj/mm/aa │  XXXXX   │  Compte débité              │   Montant   │             │
│          │  XXXXX   │      Compte crédité         │             │   Montant   │
│          │          │  Libellé de l'opération     │             │             │
└──────────┴──────────┴────────────────────────────┴─────────────┴─────────────┘
```

**Règles de présentation :**
- Les comptes débités s'écrivent **en premier**, à gauche
- Les comptes crédités s'écrivent **ensuite**, décalés à droite
- Chaque écriture est séparée par un trait horizontal
- Un **libellé explicatif** est obligatoire sous chaque écriture

### Exemple de Journal (en F CFA)

```
┌──────────┬──────────┬─────────────────────────────────┬─────────────┬─────────────┐
│  Date    │ N°Compte │             Intitulé             │   Débit     │   Crédit    │
├──────────┼──────────┼─────────────────────────────────┼─────────────┼─────────────┤
│ 01/01/N  │   521    │ Banque                          │  5 000 000  │             │
│          │   101    │     Capital social              │             │  5 000 000  │
│          │          │  Constitution de la société     │             │             │
├──────────┼──────────┼─────────────────────────────────┼─────────────┼─────────────┤
│ 05/01/N  │   601    │ Achats de marchandises          │    800 000  │             │
│          │  4452    │ TVA déductible (18%)            │    144 000  │             │
│          │   401    │     Fournisseurs                │             │    944 000  │
│          │          │  Achat à crédit — Facture F001  │             │             │
├──────────┼──────────┼─────────────────────────────────┼─────────────┼─────────────┤
│ 10/01/N  │   411    │ Clients                         │  1 180 000  │             │
│          │   701    │     Ventes de marchandises      │             │  1 000 000  │
│          │  4431    │     TVA collectée (18%)         │             │    180 000  │
│          │          │  Vente à crédit — Facture V001  │             │             │
├──────────┼──────────┼─────────────────────────────────┼─────────────┼─────────────┤
│ 15/01/N  │   641    │ Salaires et appointements       │    500 000  │             │
│          │   521    │     Banque                      │             │    500 000  │
│          │          │  Paiement salaires du mois      │             │             │
├──────────┼──────────┼─────────────────────────────────┼─────────────┼─────────────┤
│ 20/01/N  │   401    │ Fournisseurs                    │    944 000  │             │
│          │   521    │     Banque                      │             │    944 000  │
│          │          │  Règlement fournisseur F001     │             │             │
└──────────┴──────────┴─────────────────────────────────┴─────────────┴─────────────┘
```

### Tableau des écritures types SYSCOHADA

| Opération | Comptes Débités | Comptes Crédités |
|-----------|-----------------|------------------|
| Apport en capital (banque) | 521 Banque | 101 Capital |
| Apport en capital (espèces) | 571 Caisse | 101 Capital |
| Emprunt bancaire | 521 Banque | 16 Emprunts |
| Achat marchandises au comptant | 601 Achats + 4452 TVA/déd. | 521 Banque |
| Achat marchandises à crédit | 601 Achats + 4452 TVA/déd. | 401 Fournisseurs |
| Vente marchandises au comptant | 521 Banque | 701 Ventes + 4431 TVA/coll. |
| Vente marchandises à crédit | 411 Clients | 701 Ventes + 4431 TVA/coll. |
| Règlement client (encaissement) | 521 Banque | 411 Clients |
| Règlement fournisseur (paiement) | 401 Fournisseurs | 521 Banque |
| Paiement salaires | 641 Salaires | 521 Banque |
| Achat immobilisation à crédit | 22/23/24 Immobilisations | 481 Fournisseurs d'investissement |
| Dotation aux amortissements | 681 Dotations amort. | 28 Amortissements |
| Paiement loyer | 622 Loyers | 521 Banque |
| Déclaration TVA à payer | 4431 TVA collectée | 4452 TVA déductible + 4441 TVA à décaisser |

---

## 5. Le Grand Livre

### Définition

Le grand livre est le **registre de tous les comptes** de l'entreprise. Il reprend l'ensemble des écritures du journal, **classées compte par compte**. Il permet de connaître la situation de chaque compte à tout moment.

### Présentation en compte en T

Pour chaque compte, on reporte les débits à gauche et les crédits à droite :

```
              521 — BANQUE
  ────────────────────────────────────
    DÉBIT              |    CRÉDIT
  ─────────────────────|──────────────
  01/01 Capital  5 000 000 | 15/01 Salaires  500 000
                           | 20/01 Fournis.  944 000
  ─────────────────────────────────────
  Total Débit    5 000 000 | Total Crédit  1 444 000
  ─────────────────────────────────────
  Solde Débiteur (SD) = 5 000 000 − 1 444 000 = 3 556 000
```

```
              411 — CLIENTS
  ────────────────────────────────────
    DÉBIT              |    CRÉDIT
  ─────────────────────|──────────────
  10/01 Vente  1 180 000 |
  ─────────────────────────────────────
  Total Débit  1 180 000 | Total Crédit          0
  ─────────────────────────────────────
  Solde Débiteur (SD) = 1 180 000
```

### Formule de calcul du solde

```
Solde = Total Débit − Total Crédit

  Si Solde > 0 → Solde Débiteur (SD)
  Si Solde < 0 → Solde Créditeur (SC)
  Si Solde = 0 → Compte soldé
```

### Soldes normaux par classe

| Classe | Comptes | Solde normal |
|--------|---------|--------------|
| Classe 1 — Ressources durables | Capital, Emprunts | **Créditeur (SC)** |
| Classe 2 — Immobilisations | Terrains, Bâtiments | **Débiteur (SD)** |
| Classe 3 — Stocks | Marchandises, MP | **Débiteur (SD)** |
| Classe 4 — Clients (411) | Créances clients | **Débiteur (SD)** |
| Classe 4 — Fournisseurs (401) | Dettes fournisseurs | **Créditeur (SC)** |
| Classe 5 — Trésorerie | Banque, Caisse | **Débiteur (SD)** |
| Classe 6 — Charges | Salaires, Achats | **Débiteur (SD)** |
| Classe 7 — Produits | Ventes, Services | **Créditeur (SC)** |

---

## 6. La Balance des Comptes

### Définition

La balance est un document de synthèse qui liste **tous les comptes** avec leurs totaux mouvements et leurs soldes. Elle est établie à partir du grand livre et sert à **vérifier l'équilibre général** de la comptabilité.

### Vérifications obligatoires

```
Vérification 1 : Total des Mouvements Débit = Total des Mouvements Crédit
Vérification 2 : Total des Soldes Débiteurs = Total des Soldes Créditeurs
```

Si ces égalités ne sont pas respectées, il existe une **erreur d'enregistrement**.

### Types de balance SYSCOHADA

| Type | Colonnes | Usage |
|------|----------|-------|
| Balance à 2 colonnes | Solde Débiteur / Solde Créditeur | Vérification rapide |
| Balance à 4 colonnes | Mvt Débit / Mvt Crédit / SD / SC | Suivi standard |
| Balance à 6 colonnes | SI Déb/Créd + Mvt Déb/Créd + SF Déb/Créd | Usage professionnel complet |

### Modèle de Balance à 6 colonnes

```
┌─────────┬─────────────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│  N°Cte  │         Intitulé        │  Mvt. Débit  │  Mvt. Crédit │  Sol. Débit  │  Sol. Crédit │
├─────────┼─────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│   101   │ Capital                 │           —  │   5 000 000  │           —  │   5 000 000  │
│   401   │ Fournisseurs            │     944 000  │     944 000  │           —  │           —  │
│   411   │ Clients                 │   1 180 000  │           —  │   1 180 000  │           —  │
│   521   │ Banque                  │   5 000 000  │   1 444 000  │   3 556 000  │           —  │
│   601   │ Achats marchandises     │     800 000  │           —  │     800 000  │           —  │
│   641   │ Salaires                │     500 000  │           —  │     500 000  │           —  │
│   701   │ Ventes marchandises     │           —  │   1 000 000  │           —  │   1 000 000  │
│  4431   │ TVA collectée           │           —  │     180 000  │           —  │     180 000  │
│  4452   │ TVA déductible          │     144 000  │           —  │     144 000  │           —  │
├─────────┼─────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ TOTAUX  │                         │   8 568 000  │   8 568 000  │   6 180 000  │   6 180 000  │
└─────────┴─────────────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

> ✅ Balance équilibrée : Total Mvt Débit (8 568 000) = Total Mvt Crédit (8 568 000)
> ✅ Total SD (6 180 000) = Total SC (6 180 000)

### Étapes d'établissement de la balance

1. Rassembler tous les comptes du grand livre
2. Calculer le total des mouvements débit et crédit de chaque compte
3. Calculer le solde (débiteur ou créditeur) de chaque compte
4. Additionner toutes les colonnes
5. Vérifier les deux équilibres obligatoires

---

## 7. Le Compte de Résultat

### Définition

Le compte de résultat mesure la **performance économique** de l'entreprise sur un exercice. Il compare les produits (recettes) aux charges (dépenses) pour dégager un **résultat net**.

### Formule principale

```
Résultat Net = Total Produits − Total Charges

  Si Résultat > 0 → BÉNÉFICE (Profit)
  Si Résultat < 0 → PERTE (Déficit)
  Si Résultat = 0 → Équilibre
```

### Soldes Intermédiaires de Gestion (SIG) SYSCOHADA

Les SIG permettent d'analyser la formation du résultat étape par étape :

#### 1. Chiffre d'Affaires (CA)
```
CA = Ventes de marchandises (701) + Travaux, services (702-706)
```

#### 2. Marge Brute sur Marchandises (MBM)
```
MBM = Ventes marchandises (701) − Achats marchandises (601) ± Variation de stocks (6031)
```

#### 3. Valeur Ajoutée (VA)
```
VA = MBM + Production de l'exercice (72)
     − Consommations intermédiaires (601+602+604+605+608+61+62)
```

#### 4. Excédent Brut d'Exploitation (EBE)
```
EBE = VA + Subventions d'exploitation (71)
      − Impôts et taxes (64)
      − Charges de personnel (641 + 642 + 643 + 644 + 645)
```

#### 5. Résultat d'Exploitation (RE)
```
RE = EBE + Reprises et transferts de charges (791)
         + Autres produits (75)
         − Dotations aux amortissements et provisions (681)
         − Autres charges (65)
```

#### 6. Résultat Financier (RF)
```
RF = Revenus financiers (77) − Charges financières (67)
```

#### 7. Résultat des Activités Ordinaires (RAO)
```
RAO = RE + RF
```

#### 8. Résultat Hors Activités Ordinaires (RHAO)
```
RHAO = Produits HAO (82 + 84 + 86) − Charges HAO (81 + 83 + 85)
```

#### 9. Résultat Avant Impôt (RAI)
```
RAI = RAO + RHAO
```

#### 10. Résultat Net (RN)
```
RN = RAI − Impôt sur le résultat (891)
```

### Modèle de Compte de Résultat

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    COMPTE DE RÉSULTAT — Exercice N                          │
├────────────────────────────┬────────────┬────────────────────────┬──────────┤
│         CHARGES            │  Montant   │        PRODUITS        │  Montant │
├────────────────────────────┼────────────┼────────────────────────┼──────────┤
│ Achats de marchands  (601) │    800 000 │ Ventes march.   (701)  │1 800 000 │
│ Variation stocks     (603) │          0 │ Services vendus  (706)  │  150 000 │
│ Transports          (624)  │     50 000 │ Prod. stockée    (72)   │        0 │
│ Salaires            (641)  │    500 000 │ Revenus financiers(77)  │   50 000 │
│ Charges sociales    (645)  │    100 000 │                        │          │
│ Dotations amort.    (681)  │    100 000 │                        │          │
│ Intérêts            (661)  │     50 000 │                        │          │
│ TOTAL CHARGES AO           │  1 600 000 │ TOTAL PRODUITS AO      │2 000 000 │
├────────────────────────────┼────────────┼────────────────────────┼──────────┤
│ Charges HAO         (83)   │          0 │ Produits HAO    (84)   │        0 │
├────────────────────────────┼────────────┼────────────────────────┼──────────┤
│ Impôt résultat      (891)  │    110 000 │                        │          │
├────────────────────────────┼────────────┼────────────────────────┼──────────┤
│ RÉSULTAT NET (Bénéfice)    │    290 000 │                        │          │
├────────────────────────────┼────────────┼────────────────────────┼──────────┤
│ TOTAL GÉNÉRAL              │  2 000 000 │ TOTAL GÉNÉRAL          │2 000 000 │
└────────────────────────────┴────────────┴────────────────────────┴──────────┘
```

---

## 8. Le Bilan Comptable

### Définition

Le bilan est une **photographie du patrimoine** de l'entreprise à la clôture de l'exercice. Il présente :
- À **gauche** : l'**Actif** — ce que l'entreprise possède (emplois)
- À **droite** : le **Passif** — comment c'est financé (ressources)

### Équation fondamentale

```
ACTIF = PASSIF

ACTIF = Capitaux Propres + Dettes

Total Actif = Total Passif (équilibre obligatoire)
```

### Structure du Bilan SYSCOHADA

#### ACTIF (Classes 2, 3, 4, 5)

| Rubrique | Comptes | Brut | Amort/Prov | Net |
|----------|---------|------|------------|-----|
| **ACTIF IMMOBILISÉ** | | | | |
| Immobilisations incorporelles | 211 à 213 | x | x | x |
| Immobilisations corporelles | 221 à 245 | x | x | x |
| Immobilisations financières | 26, 27 | x | — | x |
| **ACTIF CIRCULANT** | | | | |
| Stocks et en-cours | 31 à 38 | x | x | x |
| Créances clients | 411, 416 | x | x | x |
| Autres créances | 408 à 499 | x | x | x |
| **TRÉSORERIE ACTIF** | | | | |
| Titres de placement | 50, 51 | x | — | x |
| Banques, CCP | 521 à 531 | x | — | x |
| Caisse | 571 | x | — | x |
| **TOTAL ACTIF** | | | | **x** |

#### PASSIF (Classes 1, 4, 5)

| Rubrique | Comptes | Montant |
|----------|---------|---------|
| **CAPITAUX PROPRES ET RESSOURCES ASSIMILÉES** | | |
| Capital social | 101 | x |
| Primes liées au capital | 105 | x |
| Réserves | 111 à 118 | x |
| Report à nouveau | 12 | x |
| Résultat net de l'exercice | 13 | x |
| **DETTES FINANCIÈRES ET RESSOURCES ASSIMILÉES** | | |
| Emprunts et dettes financières | 16 | x |
| Dettes de location-acquisition | 17 | x |
| **PASSIF CIRCULANT** | | |
| Fournisseurs et comptes rattachés | 401, 408 | x |
| Clients, avances reçues | 419 | x |
| Dettes fiscales et sociales | 42 à 44 | x |
| **TRÉSORERIE PASSIF** | | |
| Banques, crédits d'escompte | 565 | x |
| Banques, crédits de trésorerie | 566 | x |
| **TOTAL PASSIF** | | **x** |

### Exemple de Bilan simplifié (en F CFA)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        BILAN AU 31/12/N                                     │
├──────────────────────────────┬──────────┬──────────────────────────┬────────┤
│           ACTIF              │  Montant │           PASSIF         │Montant │
├──────────────────────────────┼──────────┼──────────────────────────┼────────┤
│ ACTIF IMMOBILISÉ             │          │ CAPITAUX PROPRES         │        │
│  Terrains (211)              │  500 000 │  Capital (101)           │5 000 000│
│  Bâtiments (221)             │1 500 000 │  Réserves (111)          │  300 000│
│  Matériels (245)             │1 000 000 │  Résultat net (13)       │  290 000│
├──────────────────────────────┼──────────┼──────────────────────────┼────────┤
│ ACTIF CIRCULANT              │          │ DETTES FINANCIÈRES       │        │
│  Stocks marchandises (31)    │  400 000 │  Emprunts (16)           │2 000 000│
│  Clients (411)               │1 180 000 │                          │        │
│  TVA déductible (4452)       │  144 000 │ PASSIF CIRCULANT         │        │
├──────────────────────────────┼──────────┼──────────────────────────┼────────┤
│ TRÉSORERIE ACTIF             │          │  TVA collectée (4431)    │  180 000│
│  Banque (521)                │3 556 000 │  Autres dettes           │  510 000│
├──────────────────────────────┼──────────┼──────────────────────────┼────────┤
│ TOTAL ACTIF                  │8 280 000 │ TOTAL PASSIF             │8 280 000│
└──────────────────────────────┴──────────┴──────────────────────────┴────────┘
```

---

## 9. Processus Comptable Complet (Cycle)

Le cycle comptable suit un enchaînement logique et obligatoire :

```
                     CYCLE COMPTABLE SYSCOHADA
                     
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  1. PIÈCES JUSTIFICATIVES                                  │
  │     (Factures, chèques, bulletins de salaire, relevés)     │
  │                    ↓                                       │
  │  2. JOURNAL                                                │
  │     (Enregistrement chronologique de toutes les opérations)│
  │                    ↓                                       │
  │  3. GRAND LIVRE                                            │
  │     (Report des écritures par compte)                      │
  │                    ↓                                       │
  │  4. BALANCE                                                │
  │     (Vérification de l'équilibre débit = crédit)           │
  │                    ↓                                       │
  │  5. ÉCRITURES D'INVENTAIRE                                 │
  │     (Amortissements, provisions, régularisations)          │
  │                    ↓                                       │
  │  6. BALANCE APRÈS INVENTAIRE                               │
  │     (Vérification définitive avant états financiers)       │
  │                    ↓                                       │
  │  ┌────────────────┬──────────────────────────────────┐     │
  │  │  COMPTE DE     │           BILAN                  │     │
  │  │  RÉSULTAT      │   (Actif = Passif)               │     │
  │  │  (Produits −   │                                  │     │
  │  │   Charges)     │                                  │     │
  │  └────────────────┴──────────────────────────────────┘     │
  │                    ↓                                       │
  │  7. CLÔTURE DE L'EXERCICE                                  │
  │     (Virement du résultat, solde des comptes de gestion)   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

### Étapes détaillées

**Étape 1 — Collecte des pièces justificatives**
Toute opération comptable doit être appuyée d'une pièce justificative : facture d'achat, facture de vente, relevé bancaire, bulletin de paie, contrat, etc.

**Étape 2 — Enregistrement au Journal**
Chaque opération est traduite en écriture comptable (débit / crédit) dans le journal, par ordre chronologique.

**Étape 3 — Report au Grand Livre**
Les écritures du journal sont reportées dans les comptes correspondants du grand livre.

**Étape 4 — Établissement de la Balance**
On extrait du grand livre les totaux et les soldes de chaque compte pour établir la balance et vérifier l'équilibre.

**Étape 5 — Travaux d'inventaire (fin d'exercice)**
- Calcul et comptabilisation des **dotations aux amortissements** (681 / 28X)
- Constitution des **provisions** pour risques et charges
- **Régularisation des charges et produits** (charges constatées d'avance, produits à recevoir)
- **Inventaire physique des stocks** et ajustement

**Étape 6 — Balance après inventaire**
Nouvelle balance intégrant les écritures d'inventaire, servant de base aux états financiers.

**Étape 7 — États financiers (liasses SYSCOHADA)**
- Compte de résultat (SIG)
- Bilan
- Tableau des flux de trésorerie (TFT)
- Notes annexes

**Étape 8 — Clôture de l'exercice**
Les comptes de charges (classe 6) et de produits (classe 7) sont soldés. Le résultat est viré au compte 13 (Résultat net de l'exercice).

---

## 10. Ratios et Indicateurs Essentiels

### Ratios de structure financière (issus du bilan)

| Ratio | Formule | Interprétation |
|-------|---------|----------------|
| **Fonds de Roulement (FR)** | Ressources stables − Actif immobilisé | ≥ 0 : bonne structure financière |
| **Besoin en Fonds de Roulement (BFR)** | Actif circulant − Passif circulant | Besoin de financement du cycle d'exploitation |
| **Trésorerie Nette (TN)** | FR − BFR = Trésorerie Actif − Trésorerie Passif | Liquidité disponible immédiatement |
| **Autonomie financière** | Capitaux propres / Total passif × 100 | ≥ 50% : indépendance financière |
| **Taux d'endettement** | Dettes financières / Capitaux propres × 100 | < 100% recommandé |
| **Ratio de liquidité générale** | Actif circulant / Passif circulant | ≥ 1 : capacité à honorer les dettes à CT |

### Ratios de rentabilité (issus du compte de résultat)

| Ratio | Formule | Interprétation |
|-------|---------|----------------|
| **Taux de marge brute** | Marge brute / CA × 100 | Profitabilité commerciale |
| **Taux de valeur ajoutée** | VA / CA × 100 | Richesse créée par l'entreprise |
| **Rentabilité économique** | RE / Total Actif × 100 | Efficacité des actifs mis en œuvre |
| **Rentabilité financière** | RN / Capitaux propres × 100 | Rendement pour les actionnaires |
| **Taux de marge nette** | RN / CA × 100 | Bénéfice net pour 100 F de CA |

### Récapitulatif des formules clés

```
═══════════════════════════════════════════════════════════
                  FORMULES ESSENTIELLES
═══════════════════════════════════════════════════════════

BILAN :
  Total Actif = Total Passif
  Capitaux Propres = Capital + Réserves + Résultat
  FR = Ressources durables − Actif immobilisé
  BFR = (Stocks + Créances) − (Dettes d'exploitation)
  TN = FR − BFR

COMPTE DE RÉSULTAT :
  Marge Brute = Ventes − Coût d'achat des marchandises vendues
  VA = Production − Consommations intermédiaires
  EBE = VA + Subventions − Impôts & taxes − Charges personnel
  RE = EBE ± Autres produits/charges d'exploitation
  RAO = RE + Résultat financier
  RN = RAO + RHAO − Impôt sur le résultat

BALANCE :
  ∑ Mouvements Débit = ∑ Mouvements Crédit
  ∑ Soldes Débiteurs = ∑ Soldes Créditeurs

JOURNAL :
  Pour chaque écriture : ∑ Débits = ∑ Crédits

═══════════════════════════════════════════════════════════
```

---

*Document établi selon le référentiel SYSCOHADA Révisé (Acte Uniforme du 26 janvier 2017)*
*Monnaie de référence : Franc CFA (F CFA) — applicable dans les États de l'UEMOA et la CEMAC*