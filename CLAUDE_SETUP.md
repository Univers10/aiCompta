# Configuration Claude pour l'extraction de factures

## 🎯 Vue d'ensemble

Ce projet utilise **Claude Haiku 4.5** (Anthropic) pour l'extraction automatique de données de factures avec un système **Human-in-the-Loop** basé sur le score de confiance.

**Pourquoi Haiku ?** Optimal pour l'extraction structurée : rapide, économique, et suffisant pour analyser des factures PDF.

## 📋 Prérequis

1. **Compte Anthropic** : https://console.anthropic.com/
2. **Clé API** : Créez une clé API dans votre console Anthropic
3. **Crédits** : Assurez-vous d'avoir des crédits disponibles

## ⚙️ Configuration

### 1. Variables d'environnement

Ajoutez ces variables dans `apps/api/.env` :

```bash
# AI - Claude (Anthropic)
ANTHROPIC_API_KEY=sk-ant-api03-...  # Votre clé API Anthropic
ANTHROPIC_MODEL=claude-haiku-4-5  # Claude Haiku 4.5 (rapide, économique, Tier 1)
ANTHROPIC_MAX_TOKENS=4096

# Configuration IA
AI_CONFIDENCE_THRESHOLD=0.85  # Seuil pour Human-in-the-Loop (0.0-1.0)
```

### 2. Seuil de confiance (Human-in-the-Loop)

Le paramètre `AI_CONFIDENCE_THRESHOLD` détermine quand un humain doit valider :

| Seuil | Comportement |
|-------|--------------|
| **0.85** (recommandé) | Validation auto si confiance ≥ 85% |
| **0.95** (strict) | Validation manuelle plus fréquente |
| **0.70** (souple) | Validation auto plus fréquente |

**Score de confiance Claude** :
- **0.95-1.0** : Toutes les données claires et lisibles → Auto-validation
- **0.85-0.94** : Données complètes, quelques incertitudes → Auto-validation (seuil 0.85)
- **0.70-0.84** : Données partielles ou qualité moyenne → **NEEDS_REVIEW**
- **<0.70** : Données manquantes ou mauvaise qualité → **NEEDS_REVIEW**

## 🚀 Utilisation

### Workflow automatique

1. **Upload** : L'utilisateur uploade une facture (image ou PDF)
2. **Extraction** : Claude analyse le document et extrait :
   - Numéro de facture
   - Date et échéance
   - Fournisseur (nom, TVA/SIRET)
   - Montants (HT, TVA, TTC)
   - Lignes de facturation
   - **Score de confiance**
3. **Décision automatique** :
   - Si `confidence >= 0.85` : Génération automatique des écritures → `VALIDATED`
   - Si `confidence < 0.85` : Marqué comme `NEEDS_REVIEW` → Validation manuelle requise
4. **Écritures comptables** : Génération automatique (601, 4452, 401)

### Statuts des documents

| Statut | Description | Action |
|--------|-------------|--------|
| `PENDING` | En attente de traitement | Automatique |
| `PROCESSING` | Extraction en cours | Automatique |
| `NEEDS_REVIEW` | **Confiance faible** - Validation requise | **Humain** |
| `VALIDATED` | Validé (auto ou manuel) | Écritures générées |
| `REJECTED` | Rejeté ou erreur | Vérifier les logs |

## ✅ Support PDF et Images

### Extraction automatique selon le type

**PDF** :
- Extraction du texte avec `pdfjs-dist` (Mozilla PDF.js)
- Analyse du texte par Claude (mode texte)
- Fonctionne avec les PDF contenant du texte sélectionnable
- Supporte les PDF multi-pages

**Images** (JPEG, PNG, GIF, WebP) :
- Analyse directe avec Claude Vision
- Meilleure précision pour les factures scannées
- Supporte les images de qualité variable

**Note** : Pour les PDF scannés (images dans PDF), la qualité d'extraction peut être réduite. Privilégiez les images directes pour de meilleurs résultats.

## 📊 Monitoring

### Logs de traitement

```bash
[Invoice Processor] Starting processing for document xxx
[Claude] Starting invoice extraction...
[Claude] Received response (XXX chars)
[Claude] Extraction complete (confidence: 92%)
[Invoice Processor] High confidence, generating journal entries...
[Journal Generator] Created journal entry xxx with 3 lines
[Invoice Processor] ✅ Document processed successfully
```

### Logs d'erreur

```bash
[Claude] Extraction failed: Error message
[Invoice Processor] ❌ Error processing document xxx
```

### Base de données

Table `ExtractionAttempt` :
- `model` : claude-3-5-sonnet-20241022
- `confidence` : Score de 0 à 1
- `success` : true/false
- `rawResponse` : Données JSON extraites
- `errorMessage` : Message d'erreur si échec

## 🎨 Interface utilisateur

### Page de détail document

**Actions disponibles** :
- ✅ **Valider** : Pour documents `NEEDS_REVIEW`
- ❌ **Rejeter** : Avec motif obligatoire
- 🔄 **Ré-extraire** : Relancer l'analyse Claude

**Affichage** :
- Score de confiance IA (%)
- Données extraites (fournisseur, montants, etc.)
- Écritures comptables générées
- Historique des tentatives d'extraction

## 💰 Coûts

**Claude 3.5 Sonnet** (tarifs indicatifs) :
- Input : ~$3 / million de tokens
- Output : ~$15 / million de tokens

**Estimation par facture** :
- Image moyenne : ~1000 tokens input + 500 tokens output
- Coût : ~$0.01 par facture

## 🔐 Sécurité

- ✅ Clé API stockée dans `.env` (non versionnée)
- ✅ Validation des données extraites
- ✅ Audit trail complet
- ✅ Isolation multi-tenant

## 🐛 Dépannage

### Erreur "ANTHROPIC_API_KEY est requise"

```bash
# Vérifiez votre .env
cat apps/api/.env | grep ANTHROPIC_API_KEY
```

### Documents bloqués en PENDING

```bash
# Vérifiez les logs API
npm run dev --workspace=@aicompta/api
```

### Score de confiance toujours faible

- Vérifiez la qualité de l'image (résolution, netteté)
- Assurez-vous que le texte est lisible
- Testez avec une facture claire et structurée

## 📚 Ressources

- [Documentation Anthropic](https://docs.anthropic.com/)
- [Claude Vision Guide](https://docs.anthropic.com/claude/docs/vision)
- [Pricing Anthropic](https://www.anthropic.com/pricing)

## ✅ Checklist de mise en production

- [ ] Clé API Anthropic configurée
- [ ] Seuil de confiance ajusté selon vos besoins
- [ ] Tests avec différents types de factures
- [ ] Monitoring des coûts activé
- [ ] Workflow Human-in-the-Loop validé
- [ ] Formation des utilisateurs sur la validation manuelle
