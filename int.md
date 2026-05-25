# AI Compta — Prompt de développement Windsurf
> Guide étape par étape pour construire la v1.0 stable
> Architecture : **Backend API séparé** (Node.js/Express) + **Frontend séparé** (Next.js)

---

## Instructions globales pour Windsurf

Tu es un développeur fullstack senior spécialisé en TypeScript, Node.js et Next.js. Tu construis **AI Compta**, une application de comptabilité automatisée pour la zone OHADA (Afrique de l'Ouest), conforme au plan comptable **SYSCOHADA Révisé**.

### Principes non négociables
- **Architecture séparée** : le backend est une API REST indépendante (`/apps/api`), le frontend est une app Next.js indépendante (`/apps/web`). Ils communiquent uniquement via HTTP.
- **TypeScript strict** partout : `strict: true`, `noUncheckedIndexedAccess: true`. Aucun `any` implicite.
- **Décimaux financiers** : utilise toujours `Decimal` de la librairie `decimal.js`. Jamais de `number` ou `float` pour les montants.
- **Tenancy stricte** : chaque requête BDD passe par `withOrg(orgId, fn)`. Zéro accès direct à `prisma.*.findMany()` sans ce filtre.
- **Immutabilité comptable** : jamais de `DELETE` sur des données comptables. Uniquement des contre-passations ou soft-deletes.
- **Code propre** : un fichier = une responsabilité. Noms explicites. Pas de commentaires évidents. JSDoc sur les fonctions publiques complexes.
- **Erreurs typées** : toujours retourner des erreurs structurées `{ code, message, details? }`. Jamais de strings brutes.
- Réponds **uniquement en français** dans les commentaires JSDoc et les messages d'erreur.

### Structure du monorepo
```
aicompta/
├── apps/
│   ├── api/          ← Backend Express + Prisma (PORT 3001)
│   └── web/          ← Frontend Next.js (PORT 3000)
├── packages/
│   ├── types/        ← Types TypeScript partagés (DTOs, enums)
│   └── validators/   ← Schémas Zod partagés
├── package.json      ← Workspaces npm
└── turbo.json        ← Turborepo
```

---

## ÉTAPE 0 — Initialisation du monorepo

### Prompt 0.1 — Scaffold du monorepo

```
Initialise un monorepo npm + Turborepo avec la structure suivante :

aicompta/
├── apps/
│   ├── api/          ← Express + TypeScript
│   └── web/          ← Next.js 14 App Router + TypeScript
├── packages/
│   ├── types/        ← package @aicompta/types
│   └── validators/   ← package @aicompta/validators
├── package.json
├── npm-workspace.yaml
└── turbo.json

Contraintes :
- npm workspaces
- TypeScript strict dans chaque package (strict: true, noUncheckedIndexedAccess: true)
- turbo.json avec pipelines : build, dev, lint, test
- .gitignore complet (node_modules, .env*, dist, .next, coverage)
- .env.example à la racine avec toutes les variables (voir liste ci-dessous)
- README.md avec instructions de démarrage en < 10 minutes

Variables d'environnement (.env.example) :
# API
DATABASE_URL=postgresql://postgres:password@localhost:5432/aicompta_dev
REDIS_URL=redis://localhost:6379
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_BUCKET=aicompta-dev
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
AUTH_SECRET=change_me_32_chars_minimum
RESEND_API_KEY=re_xxx
RESEND_INBOUND_SECRET=
ANTHROPIC_API_KEY=sk-ant-xxx
ANTHROPIC_MODEL_EXTRACTION=claude-sonnet-4-5
ANTHROPIC_MODEL_CLASSIFIER=claude-haiku-4-5
MAX_UPLOAD_BYTES=26214400
AI_CONFIDENCE_THRESHOLD=0.85
LOG_LEVEL=info
PORT=3001
# Web
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### Prompt 0.2 — Package @aicompta/types

```
Dans packages/types/, crée le package @aicompta/types contenant tous les types TypeScript partagés entre l'API et le frontend.

Fichiers à créer :

src/enums.ts :
- DocumentStatus : PENDING, PROCESSING, EXTRACTED, NEEDS_REVIEW, VALIDATED, POSTED, REJECTED, CANCELLED
- DocumentType : PURCHASE_INVOICE, SALES_INVOICE, RECEIPT, EXPENSE_NOTE, BANK_STATEMENT, CREDIT_NOTE
- UserRole : OWNER, ACCOUNTANT, VIEWER
- JournalType : PURCHASE, SALES, BANK, MISC
- LineType : DEBIT, CREDIT
- AnalyticDimension : string enum ouvert

src/models.ts :
- Types pour toutes les entités : Organization, User, Membership, Document, ExtractionAttempt, JournalEntry, JournalLine, ChartOfAccount, FiscalYear, AnalyticAxis, AnalyticValue, AnalyticAllocation, ChatThread, ChatMessage, AuditLog
- Tous les montants en string (sérialisé depuis Decimal côté API)
- Dates en string ISO 8601

src/api.ts :
- Types de réponse API paginée : PaginatedResponse<T>
- Types d'erreur API : ApiError { code: string, message: string, details?: unknown }
- Types des paramètres de query pour chaque endpoint

src/extraction.ts :
- ExtractionResult : { supplier, date, invoiceNumber, lines: ExtractionLine[], totalHT, totalTVA, totalTTC, currency, confidence, rawResponse }
- ExtractionLine : { description, accountCode, amountHT, tvaRate, amountTVA, amountTTC }
- IExtractor interface : extract(fileBuffer: Buffer, mimeType: string, orgId: string) => Promise<ExtractionResult>

Export tout depuis src/index.ts.
```

---

### Prompt 0.3 — Package @aicompta/validators

```
Dans packages/validators/, crée le package @aicompta/validators avec tous les schémas Zod partagés.

Dépendance : zod ^3.x, @aicompta/types

Fichiers :

src/document.ts :
- UploadDocumentSchema : { file validation, orgId }
- DocumentQuerySchema : { page, limit, status?, type?, supplierId?, dateFrom?, dateTo?, search? }
- ValidateDocumentSchema : { corrections?: Partial<ExtractionResult> }
- RejectDocumentSchema : { reason: string (min 10 chars) }

src/journal.ts :
- JournalEntryQuerySchema : { page, limit, journal?, accountCode?, dateFrom?, dateTo?, amountMin?, amountMax? }
- CancelJournalEntrySchema : { reason: string }

src/reports.ts :
- BalanceQuerySchema : { date: string ISO, analyticValueId? }
- PnlQuerySchema : { dateFrom, dateTo, analyticValueId? }
- BalanceSheetQuerySchema : { date: string ISO }
- GeneralLedgerQuerySchema : { accountCode, dateFrom, dateTo }

src/chat.ts :
- ChatMessageSchema : { threadId?: string, message: string (max 2000 chars) }

src/auth.ts :
- SignupSchema : { email, organizationName }
- InviteMemberSchema : { email, role: UserRole }

src/env.ts :
- EnvSchema : Zod schema validant toutes les variables d'environnement obligatoires
  (DATABASE_URL, REDIS_URL, AUTH_SECRET, ANTHROPIC_API_KEY, RESEND_API_KEY, etc.)
- Exporte la fonction parseEnv() qui fait process.exit(1) avec message clair si une variable manque

Export tout depuis src/index.ts.
```

---

## ÉTAPE 1 — Backend API (apps/api)

### Prompt 1.1 — Structure de base Express

```
Dans apps/api/, initialise l'application Express avec la structure suivante :

src/
├── index.ts              ← Entry point (démarre le serveur)
├── app.ts                ← Config Express (middlewares, routes)
├── config/
│   └── env.ts            ← Appel parseEnv() de @aicompta/validators
├── lib/
│   ├── db/
│   │   ├── prisma.ts     ← Singleton PrismaClient avec globalThis
│   │   └── tenant.ts     ← withOrg() helper
│   ├── logger.ts         ← Pino avec requestId correlation
│   ├── errors.ts         ← Classes d'erreurs typées (AppError, NotFoundError, ForbiddenError, etc.)
│   └── response.ts       ← Helpers success() et error() pour les réponses JSON
├── middleware/
│   ├── auth.ts           ← Vérification JWT Better-Auth
│   ├── tenant.ts         ← Injection orgId dans req depuis le token
│   ├── validate.ts       ← Middleware Zod (validateBody, validateQuery, validateParams)
│   └── rateLimit.ts      ← Rate limiting par IP + par org
├── routes/
│   └── index.ts          ← Agrège toutes les routes sous /api/v1
└── workers/
    └── index.ts          ← Entry point BullMQ worker (process séparé)

Contraintes :
- Express 4.x avec express-async-errors (gestion async sans try/catch partout)
- Pino pour les logs JSON structurés avec requestId généré par uuid sur chaque requête
- Classe AppError(message, statusCode, code) étendue par NotFoundError, ForbiddenError, ValidationError, ConflictError
- Middleware d'erreur global qui intercepte AppError et retourne { code, message, details }
- CORS configuré pour accepter uniquement NEXT_PUBLIC_APP_URL
- Helmet pour les headers de sécurité
- Compression gzip
- Health check sur GET /health
- withOrg(orgId, fn) : wrapper générique qui injecte organizationId dans les queries Prisma
  Signature : withOrg<T>(orgId: string, fn: (orgId: string) => Promise<T>): Promise<T>
  Lance ForbiddenError si orgId est undefined ou vide.
```

---

### Prompt 1.2 — Prisma schema complet

```
Dans apps/api/prisma/, crée le schema.prisma complet pour AI Compta.

Modèles requis (tous avec organizationId sauf User et Organization) :

Organization {
  id, name, slug (unique), createdAt, updatedAt
  relations : memberships, fiscalYears, chartOfAccounts, documents, journalEntries,
              analyticAxes, suppliers, customers, chatThreads, auditLogs
}

User {
  id, email (unique), name?, createdAt, updatedAt
  relations : memberships, sessions
}

Membership {
  id, userId, organizationId, role (OWNER|ACCOUNTANT|VIEWER), createdAt
  unique(userId, organizationId)
}

Session {
  id, userId, token (unique), expiresAt, createdAt
}

FiscalYear {
  id, organizationId, name, startDate, endDate, isClosed, createdAt
}

ChartOfAccount {
  id, organizationId, code, label, type (ASSET|LIABILITY|EQUITY|REVENUE|EXPENSE), parentCode?
  unique(organizationId, code)
}

Supplier {
  id, organizationId, name, taxId?, email?, phone?, address?, createdAt
}

Customer {
  id, organizationId, name, taxId?, email?, phone?, address?, createdAt
}

AnalyticAxis {
  id, organizationId, name, description?
  relations : values
}

AnalyticValue {
  id, analyticAxisId, organizationId, label
  relations : allocations
}

Document {
  id, organizationId, status (DocumentStatus enum), type (DocumentType enum)?
  fileName, mimeType, fileSizeBytes, fileHash, fileUrl
  extractedData Json?
  confidence Decimal?
  invoiceNumber?, invoiceDate?, supplierId?, customerId?
  totalHT Decimal?, totalTVA Decimal?, totalTTC Decimal?
  currency (défaut XOF), fxRate Decimal (défaut 1)
  validatedById?, validatedAt?
  rejectedReason?
  createdAt, updatedAt
  unique(organizationId, fileHash)
  unique(organizationId, invoiceNumber, supplierId) -- partial index si les deux sont non-null
  relations : extractionAttempts, journalEntries
}

ExtractionAttempt {
  id, documentId, organizationId
  model, promptTokens Int, completionTokens Int, costUsd Decimal
  confidence Decimal, rawResponse Json
  success Boolean, errorMessage?
  createdAt
}

JournalEntry {
  id, organizationId, fiscalYearId, journal (JournalType)
  date, reference, description
  documentId?
  isReversal Boolean (défaut false), reversalOfId?
  postedAt, createdById
  createdAt
  relations : lines
}

JournalLine {
  id, journalEntryId, organizationId
  accountCode, accountLabel
  lineType (DEBIT|CREDIT)
  amount Decimal  -- toujours positif
  currency, fxRate Decimal, amountXof Decimal
  description?
  supplierId?, customerId?
  relations : analyticAllocations
}

AnalyticAllocation {
  id, journalLineId, organizationId
  analyticValueId
  percentage Decimal  -- 0-100
  amountXof Decimal
}

ChatThread {
  id, organizationId, userId, title?, createdAt
  relations : messages
}

ChatMessage {
  id, threadId, organizationId
  role (user|assistant|tool)
  content Text
  toolCalls Json?
  inputTokens Int?, outputTokens Int?
  createdAt
}

AuditLog {
  id, organizationId, userId?
  action String  -- ex: "document.validated", "entry.cancelled"
  targetType String, targetId String
  metadata Json?
  ip String?, userAgent String?
  createdAt
}

Contraintes BDD :
- Tous les Decimal avec @db.Decimal(20, 4)
- Index composites (organizationId, createdAt) sur Document, JournalEntry, AuditLog
- Index (organizationId, status) sur Document
- Index (organizationId, accountCode) sur JournalLine
- Trigger PostgreSQL vérifiant que SUM(debit lines) = SUM(credit lines) sur JournalEntry
  (à ajouter dans une migration SQL raw)

Crée aussi seed.ts qui :
1. Crée une organisation "Demo SARL" avec un user admin demo@aicompta.app
2. Seed le plan comptable SYSCOHADA complet (les 50+ comptes les plus utilisés de la classe 1 à 8)
3. Crée un FiscalYear 2025-2026
```

---

### Prompt 1.3 — Modules métier lib/accounting/

```
Dans apps/api/src/lib/accounting/, crée les modules métier comptables.

chart-of-accounts.ts :
- getAccountByCode(orgId, code) : récupère un compte du plan comptable
- resolveAccountForDocument(orgId, keywords: string[], documentType) : 
  retourne le code de compte le plus probable selon des mots-clés
  (utilise d'abord la table ChartOfAccount de l'org, puis un mapping par défaut)
- SYSCOHADA_DEFAULT_MAPPING : Record<string, string> mapping mots-clés → codes
  Exemples : "honoraire" → "622", "télécom|internet|saas" → "626", "transport|deplacement" → "625"

validators.ts :
- validateAmounts(ht: Decimal, tva: Decimal, ttc: Decimal, tolerance = 0.01) : 
  lève ValidationError si HT + TVA ≠ TTC
- validateJournalBalance(lines: { lineType, amount: Decimal }[]) : 
  lève ValidationError si ΣDebit ≠ ΣCredit
- validateTvaRate(rate: Decimal) : 
  lève ValidationError si le taux n'est pas dans [0, 9, 18] ou 'exonere'
- Toutes ces fonctions retournent void si valide, lèvent AppError si invalide

journal.ts :
- buildPurchaseInvoiceEntry(extracted: ExtractionResult, doc: Document, orgId: string) : JournalEntryCreateInput
- buildSalesInvoiceEntry(extracted: ExtractionResult, doc: Document, orgId: string) : JournalEntryCreateInput
- buildExpenseNoteEntry(extracted: ExtractionResult, doc: Document, orgId: string) : JournalEntryCreateInput
- buildReversalEntry(originalEntry: JournalEntry, userId: string) : JournalEntryCreateInput
  (contre-passation : inverse tous les débits/crédits)
- Chaque builder appelle validateJournalBalance() avant de retourner

reports/balance.ts :
- getBalance(orgId, date: Date, analyticValueId?) : Promise<BalanceReport>
  Retourne par compte : { code, label, totalDebit, totalCredit, solde }
  
reports/pnl.ts :
- getPnL(orgId, dateFrom: Date, dateTo: Date) : Promise<PnLReport>
  Structure SYSCOHADA : charges (classe 6) vs produits (classe 7), résultat net

reports/balance-sheet.ts :
- getBalanceSheet(orgId, date: Date) : Promise<BalanceSheetReport>
  Actif (classe 1-5 débiteur) vs Passif (classe 1-5 créditeur + classes 1-2 passif)

reports/general-ledger.ts :
- getGeneralLedger(orgId, accountCode, dateFrom, dateTo) : Promise<GeneralLedgerReport>
  Solde initial + mouvements chronologiques + solde progressif

Tous les montants retournés sont des string (sérialisés depuis Decimal).
```

---

### Prompt 1.4 — Module extraction IA

```
Dans apps/api/src/lib/extraction/, crée le pipeline d'extraction IA.

types.ts :
- Interface IExtractor avec méthode :
  extract(fileBuffer: Buffer, mimeType: string, orgId: string): Promise<ExtractionResult>
- Importe ExtractionResult depuis @aicompta/types

classifier.ts :
- classifyDocument(fileName: string, mimeType: string, firstPageBuffer?: Buffer): Promise<DocumentType>
  Règles heuristiques d'abord (mots-clés dans le nom de fichier : "facture" → PURCHASE_INVOICE, etc.)
  Si incertain → appel Claude Haiku avec un prompt minimal
  Retourne DocumentType

claude.ts (implémentation IExtractor) :
- Classe ClaudeExtractor implements IExtractor
- Méthode extract() :
  1. Encode le fichier en base64
  2. Appelle l'API Anthropic avec claude-sonnet-4-5, temperature=0, forced tool use
  3. L'outil forcé s'appelle "extract_document_data" avec le schéma Zod exact des champs à extraire
  4. Valide la réponse avec le schéma Zod
  5. Calcule un score de confiance (0-1) basé sur les champs présents et cohérents
  6. Retourne ExtractionResult

Prompt système pour l'extraction (dans system-prompts.ts) :
"Tu es un expert-comptable SYSCOHADA. Extrais les données de cette pièce justificative avec précision maximale.
 Respecte ces règles :
 - Les montants sont en XOF par défaut sauf indication explicite d'une autre devise
 - Le taux de TVA doit être exactement 0, 9 ou 18 (ou 'exonere')
 - Si un champ est illisible ou absent, laisse-le null (ne devine pas)
 - Pour le code de compte, utilise le plan SYSCOHADA Révisé"

index.ts (façade) :
- Exporte getExtractor(): IExtractor (retourne ClaudeExtractor)
- Fonction principale processDocument(documentId: string, orgId: string): Promise<void>
  1. Charge le document depuis la BDD
  2. Télécharge le fichier depuis R2
  3. Classifie le document
  4. Extrait les données
  5. Valide les montants (validateAmounts)
  6. Génère l'écriture (journal.ts builders)
  7. Valide l'équilibre (validateJournalBalance)
  8. Persiste ExtractionAttempt + met à jour Document + persiste JournalEntry si confiance >= seuil
  9. Gestion des erreurs : toujours persiste un ExtractionAttempt même en cas d'échec
  Tout dans une prisma.$transaction() atomique pour les étapes 8
```

---

### Prompt 1.5 — Queue BullMQ

```
Dans apps/api/src/lib/queue/ et src/workers/, crée le système de queue.

lib/queue/connection.ts :
- Exporte redisConnection (IORedis) singleton
- Exporte extractionQueue (BullMQ Queue) nommée "extraction"
- Exporte function addExtractionJob(documentId: string, orgId: string): Promise<void>
  Options : attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 100

lib/queue/jobs/extract-document.ts :
- Définit le type ExtractionJobData { documentId: string, orgId: string }
- Exporte processExtractionJob(job: Job<ExtractionJobData>): Promise<void>
  Appelle processDocument() de lib/extraction/index.ts
  Si erreur : met le document en NEEDS_REVIEW et log l'erreur

workers/index.ts :
- Crée un Worker BullMQ qui consomme "extraction"
- Concurrence : 3 jobs simultanés
- Log structuré Pino sur chaque job (start, success, failure avec durée)
- Gestion graceful shutdown (SIGTERM)
- Ce fichier est un process Node.js séparé (ne pas l'importer dans app.ts)

Ajoute dans package.json de apps/api :
"dev:worker": "tsx watch src/workers/index.ts"
"start:worker": "node dist/workers/index.js"
```

---

### Prompt 1.6 — Routes API : Documents

```
Dans apps/api/src/routes/documents/, crée toutes les routes documents.

Fichiers :
- index.ts : agrège les routes
- upload.ts : POST /documents
- list.ts : GET /documents
- detail.ts : GET /documents/:id
- validate.ts : POST /documents/:id/validate
- reject.ts : POST /documents/:id/reject
- reextract.ts : POST /documents/:id/reextract

Implémentation de chaque route :

POST /documents :
  Auth : ACCOUNTANT+
  Body : multipart/form-data avec champ "file"
  Validation : taille (MAX_UPLOAD_BYTES), type MIME (PDF/JPEG/PNG/HEIC uniquement)
  Logique :
    1. Calcule SHA-256 du buffer
    2. Vérifie l'absence de doublon (même hash dans l'org) → 409 si doublon
    3. Upload vers R2 avec clé : {orgId}/{year}/{month}/{uuid}.{ext}
    4. Crée Document en statut PENDING
    5. Ajoute job BullMQ via addExtractionJob()
    6. Retourne 202 { documentId, status: "PENDING" }

GET /documents :
  Auth : VIEWER+
  Query : DocumentQuerySchema (page, limit, status, type, dateFrom, dateTo, search)
  Retourne : PaginatedResponse<Document> avec curseur ou offset

GET /documents/:id :
  Auth : VIEWER+
  Retourne : Document complet + extractionAttempts (triés par date desc) + journalEntry liée
  Inclut une URL signée temporaire (15 min) pour le fichier R2

POST /documents/:id/validate :
  Auth : ACCOUNTANT+
  Body : { corrections?: Partial<ExtractionResult> }
  Logique :
    1. Vérifie que statut est NEEDS_REVIEW ou EXTRACTED
    2. Si corrections fournies : re-applique les validateurs sur les montants corrigés
    3. Génère/met à jour l'écriture comptable
    4. Passe le statut à POSTED
    5. Crée AuditLog "document.validated"
    6. Retourne 200 avec document mis à jour

POST /documents/:id/reject :
  Auth : ACCOUNTANT+
  Body : { reason: string }
  Logique : passe à REJECTED, stocke le motif, crée AuditLog "document.rejected"

POST /documents/:id/reextract :
  Auth : ACCOUNTANT+
  Logique : passe à PENDING, ajoute nouveau job BullMQ, crée AuditLog "document.reextracted"

Toutes les routes :
- Utilisent withOrg() pour tous les accès Prisma
- Vérifient que le document appartient à l'org (sinon 404 pas 403 — ne pas révéler l'existence)
- Retournent des réponses via les helpers success() et error() de lib/response.ts
```

---

### Prompt 1.7 — Routes API : Journal, États, Chat

```
Crée les routes restantes dans apps/api/src/routes/.

journal-entries/ :

GET /journal-entries :
  Auth : VIEWER+
  Query : JournalEntryQuerySchema
  Retourne : PaginatedResponse<JournalEntry> avec ses lines incluses
  Filtre obligatoire orgId via withOrg()

POST /journal-entries/:id/cancel :
  Auth : ACCOUNTANT+
  Body : { reason: string }
  Logique :
    1. Charge l'entrée, vérifie qu'elle est POSTED et non déjà annulée
    2. Appelle buildReversalEntry()
    3. Persiste la nouvelle entrée dans une $transaction
    4. Met le document lié en CANCELLED
    5. Crée AuditLog "entry.cancelled"

reports/ :

GET /reports/balance?date=ISO :
  Auth : VIEWER+
  Appelle getBalance() de lib/accounting/reports/balance.ts

GET /reports/pnl?dateFrom=ISO&dateTo=ISO :
  Auth : VIEWER+
  Appelle getPnL() de lib/accounting/reports/pnl.ts

GET /reports/balance-sheet?date=ISO :
  Auth : VIEWER+
  Appelle getBalanceSheet()

GET /reports/general-ledger?accountCode=X&dateFrom=ISO&dateTo=ISO :
  Auth : VIEWER+
  Appelle getGeneralLedger()

Tous les endpoints reports acceptent un query param ?format=json|csv|xlsx
Si csv ou xlsx : génère le fichier côté API et retourne en téléchargement direct

chat/ :

POST /chat :
  Auth : VIEWER+
  Body : { threadId?, message }
  Logique :
    1. Charge ou crée le ChatThread
    2. Persiste le message utilisateur
    3. Prépare les tools IA (voir lib/ai/tools/)
    4. Appelle Anthropic Streaming API via @anthropic-ai/sdk
    5. Retourne une réponse SSE (Server-Sent Events)
    6. Persiste le message assistant en fin de stream
    7. Log les tokens consommés dans ChatMessage

GET /chat/threads :
  Auth : VIEWER+
  Retourne la liste des threads de l'org avec le dernier message

email-inbound/ :

POST /webhooks/email-inbound :
  Pas d'auth JWT — vérification signature HMAC Resend (RESEND_INBOUND_SECRET)
  Logique :
    1. Parse le webhook Resend
    2. Identifie l'org via le slug dans l'adresse email destinataire ({slug}@inbox.aicompta.app)
    3. Pour chaque pièce jointe (PDF/image) : crée un Document et ajoute un job extraction
    4. Retourne 200 immédiatement (Resend ne doit pas retry)
```

---

### Prompt 1.8 — Module Copilote IA

```
Dans apps/api/src/lib/ai/, crée le module complet du copilote.

tools/definitions.ts :
Définit les 8 outils avec leurs schémas Zod (pour le forced tool calling Anthropic) :

- search_documents : { type?, supplierId?, dateFrom?, dateTo?, amountMin?, amountMax? }
- search_journal_entries : { journal?, accountCode?, dateFrom?, dateTo?, amountMin?, amountMax? }
- get_balance : { accountCode: string, date: string }
- get_pnl : { dateFrom: string, dateTo: string }
- get_top : { dimension: 'supplier'|'account'|'analytic', metric: 'amount'|'count', dateFrom: string, dateTo: string, limit?: number }
- get_trend : { metric: string, granularity: 'month'|'quarter', dateFrom: string, dateTo: string }
- compare_to_budget : { categoryId: string, dateFrom: string, dateTo: string }
- forecast : { metric: string, method: 'linear'|'seasonal', months: number }

tools/handlers.ts :
Implémentation de chaque outil. Chaque handler :
- Accepte (params, orgId: string) — orgId TOUJOURS injecté par le serveur, jamais par le LLM
- Retourne des données sérialisées (montants en string)
- Appelle les fonctions de lib/accounting/ pour tous les calculs

guards.ts :
- injectOrgId(toolName, params, orgId): params — ajoute orgId aux params de chaque tool call
- validateTokenBudget(orgId, inputTokens): Promise<void> — vérifie le quota mensuel
- sanitizeToolError(error): string — reformule les erreurs techniques en messages utilisateur

system-prompts.ts :
- COPILOTE_SYSTEM_PROMPT : string
  "Tu es le copilote financier d'AI Compta, assistant des dirigeants de PME en zone OHADA.
   Règles strictes :
   - Tu ne fais JAMAIS de calculs toi-même : utilise toujours un outil pour obtenir les chiffres
   - Chaque chiffre que tu cites doit provenir d'un appel d'outil récent dans cette conversation
   - Tu cites toujours la source : 'Selon les écritures du [date] au [date]...'
   - Tu réponds en français, de façon concise et professionnelle
   - Tu ne peux pas créer, modifier ou annuler des écritures comptables
   - Si tu ne sais pas, dis-le clairement plutôt que d'inventer"

chat.ts :
- processChatMessage(threadId, userMessage, orgId, userId): AsyncGenerator<ChatStreamChunk>
  1. Charge l'historique du thread (30 derniers messages max)
  2. Appelle Anthropic streaming avec tous les tools définis
  3. Sur chaque tool_use block : appelle injectOrgId() puis le handler correspondant
  4. Yield les chunks texte au fur et à mesure
  5. Yield un chunk final { type: 'done', sources: [...] } avec les références des données utilisées
  6. Ne jamais exposer de stacktrace dans le stream
```

---

### Prompt 1.9 — Auth avec Better-Auth

```
Dans apps/api/src/lib/auth/ et apps/api/src/routes/auth/, configure Better-Auth.

lib/auth/config.ts :
- Initialise Better-Auth avec :
  - Adapter : Prisma (apps/api/src/lib/db/prisma.ts)
  - Plugins : organization (multi-org natif), magicLink (email via Resend)
  - Email templates : invitation, magic link (en français)
  - Session : JWT, durée 7 jours, refresh automatique

lib/auth/middleware.ts :
- Middleware Express requireAuth() : vérifie le token JWT, injecte req.user et req.session
- Middleware requireRole(minRole: UserRole) : vérifie que req.user a le rôle minimum dans l'org courante
  Ordre des rôles : VIEWER < ACCOUNTANT < OWNER

routes/auth/ :
- POST /auth/signup : { email, organizationName } → crée User + Organization + Membership OWNER + envoie magic link
- POST /auth/magic-link : { email } → envoie magic link pour login
- GET /auth/verify : { token } → vérifie le magic link, retourne session JWT
- POST /auth/invite : { email, role } → invite un membre (OWNER uniquement)
- DELETE /auth/members/:userId : révoque un accès (OWNER uniquement)
- GET /auth/me : retourne User + Membership courante
- POST /auth/logout : invalide la session

Sécurité :
- Rate limiting sur /auth/* : 5 requêtes/minute par IP
- Magic links expirés après 15 minutes
- Tokens de session signés avec AUTH_SECRET (HMAC-SHA256)
```

---

## ÉTAPE 2 — Frontend (apps/web)

### Prompt 2.1 — Structure Next.js et design system

```
Dans apps/web/, initialise Next.js 14 avec App Router et configure le design system.

Structure :
src/
├── app/
│   ├── (auth)/           ← Pages publiques (login, signup)
│   ├── (app)/            ← Zone protégée (middleware auth)
│   │   ├── layout.tsx    ← Layout principal avec sidebar + chat
│   │   ├── inbox/
│   │   ├── dashboard/
│   │   ├── documents/[id]/
│   │   ├── ledger/
│   │   ├── reports/
│   │   ├── analytics/
│   │   └── settings/
│   ├── layout.tsx        ← Root layout
│   └── page.tsx          ← Landing publique
├── components/
│   ├── ui/               ← shadcn/ui
│   ├── layout/           ← Sidebar, Header, ChatPanel
│   ├── documents/        ← Uploader, DocumentCard, StatusBadge, DocumentViewer
│   ├── ledger/           ← JournalTable, AccountTree, BalanceGrid
│   ├── reports/          ← ReportTable, ExportButton
│   ├── dashboard/        ← KPICard, TrendChart, AlertBanner
│   └── chat/             ← ChatPanel, MessageBubble, ToolCallView, SourceLink
├── lib/
│   ├── api/
│   │   ├── client.ts     ← fetch wrapper avec auth headers + error handling
│   │   ├── documents.ts  ← hooks et fonctions API documents
│   │   ├── journal.ts
│   │   ├── reports.ts
│   │   └── chat.ts       ← SSE streaming
│   ├── auth/
│   │   ├── context.tsx   ← AuthContext + useAuth hook
│   │   └── middleware.ts ← Next.js middleware (protection routes)
│   ├── hooks/
│   │   ├── useOrganization.ts
│   │   ├── useUpload.ts
│   │   └── usePagination.ts
│   └── utils/
│       ├── currency.ts   ← formatXOF(amount), formatCurrency(amount, currency)
│       ├── date.ts       ← formatDate(), formatDateTime(), parseFrenchDate()
│       └── cn.ts         ← clsx + tailwind-merge helper
└── middleware.ts         ← Protection des routes (app)

Config shadcn/ui :
- Installe : npx shadcn@latest init
- Composants à installer : button, card, dialog, dropdown-menu, form, input, label, 
  select, separator, sheet, skeleton, table, tabs, toast, badge, avatar, progress, 
  scroll-area, popover, calendar, command
- Thème : zinc base, mode sombre supporté

Palette de couleurs (globals.css) :
--primary : #1A6B9E (bleu OHADA)
--primary-foreground : white
--accent : #F5A623 (or XOF)
--success : #22C55E
--warning : #F59E0B
--destructive : #EF4444

client.ts (API client) :
- Classe ApiClient avec baseUrl depuis NEXT_PUBLIC_API_URL
- Méthodes get<T>, post<T>, put<T>, delete<T>
- Ajoute automatiquement le header Authorization: Bearer {token}
- Gère les erreurs 401 (redirect login), 403, 429 (quota IA)
- Intercepte et type les erreurs ApiError de @aicompta/types
- Exporte un singleton : export const api = new ApiClient()
```

---

### Prompt 2.2 — Pages Auth

```
Dans apps/web/src/app/(auth)/, crée les pages d'authentification.

Design : minimaliste, centré, logo AI Compta en haut, formulaire card au centre.

/login/page.tsx :
- Formulaire avec react-hook-form + Zod
- Champ email
- Bouton "Recevoir un lien de connexion"
- Animation de succès : "Email envoyé ! Vérifiez votre boîte."
- Gestion d'erreur inline (email invalide, rate limit)

/signup/page.tsx :
- Formulaire : email + nom de l'organisation
- Validation temps réel (slug unique vérifié via debounce API call)
- Après submit : même flow magic link

/verify/page.tsx :
- Page intermédiaire visitée depuis le lien email
- Spinner + "Connexion en cours..."
- Query param ?token=xxx → appel GET /auth/verify
- Succès → redirect vers /dashboard
- Erreur (token expiré) → message clair + lien pour redemander

middleware.ts :
- Protège toutes les routes /app/* : redirige vers /login si pas de session valide
- Stocke le token JWT dans un cookie httpOnly via le serveur Next.js (pas localStorage)
```

---

### Prompt 2.3 — Layout principal et Sidebar

```
Dans apps/web/src/app/(app)/layout.tsx et components/layout/, crée le layout authentifié.

Layout global :
- Sidebar fixe à gauche (largeur 240px desktop, repliable sur mobile)
- Zone de contenu principale à droite
- Chat panel IA accessible en bas via un bouton flottant ou drawer

components/layout/Sidebar.tsx :
Navigation :
  - Logo AI Compta en haut
  - Groupe "Comptabilité" :
    - Inbox (avec badge compteur NEEDS_REVIEW)
    - Dashboard
    - Journal
  - Groupe "États financiers" :
    - Balance
    - Compte de résultat
    - Bilan
    - Grand livre
  - Groupe "Analytique"
  - Groupe "Paramètres" en bas :
    - Paramètres org
    - Plan comptable
    - Membres
  - Avatar utilisateur + nom org en bas avec dropdown (profil, déconnexion)

Active state : highlight bleu sur la route courante (usePathname)
Sur mobile : sidebar en Drawer (shadcn Sheet)

components/layout/ChatPanel.tsx :
- Panneau drawer depuis le bas (ou côté droit sur desktop large)
- Bouton flottant "Demander à l'IA" avec icône chat
- Garde le contexte de l'écran courant : passe la pageContext au prompt
- S'ouvre en Sheet (mobile) ou en panneau latéral fixe (desktop ≥ 1280px)
- Persiste entre les navigations (état dans le layout)

components/layout/Header.tsx :
- Titre de la page courante
- Sélecteur de période (DateRangePicker) visible sur les pages qui le nécessitent
- Bouton d'upload rapide (shortcut vers Inbox upload)
```

---

### Prompt 2.4 — Page Inbox

```
Dans apps/web/src/app/(app)/inbox/, crée la page Inbox complète.

page.tsx :
- Title : "Inbox — Pièces justificatives"
- Zone de dépôt en haut (Uploader)
- Liste des documents avec filtres

components/documents/Uploader.tsx :
- Drag & drop avec react-dropzone
- Formats acceptés : PDF, JPEG, PNG, HEIC
- Limite : 25 Mo par fichier, 10 fichiers simultanés
- Preview des fichiers sélectionnés avant upload (miniature PDF ou image)
- Barre de progression par fichier
- Upload vers POST /api/v1/documents avec multipart
- Après upload : badge "En traitement..." qui se met à jour via polling ou WebSocket
- Gestion des erreurs inline : doublon (409), format invalide (415), trop grand (413)

components/documents/DocumentCard.tsx :
- Carte par document avec :
  - Miniature ou icône selon le type
  - Nom du fichier
  - Fournisseur extrait (si disponible)
  - Montant TTC
  - Date de facture
  - Badge de statut coloré (StatusBadge)
  - Score de confiance IA (barre de progression si < 85 %)
  - Actions contextuelles selon le statut (Valider, Corriger, Rejeter)

components/documents/StatusBadge.tsx :
- PENDING : gris "En attente"
- PROCESSING : bleu animé "Extraction..."
- EXTRACTED : bleu "Extrait"
- NEEDS_REVIEW : orange "À vérifier"
- VALIDATED : vert "Validé"
- POSTED : vert foncé "Comptabilisé"
- REJECTED : rouge "Rejeté"
- CANCELLED : gris barré "Annulé"

Filtres :
- Par statut (multi-select pills)
- Par période (DateRangePicker)
- Par type de pièce
- Recherche texte (fournisseur, n° facture)

Pagination : infini scroll ou pagination classique avec page/limit
```

---

### Prompt 2.5 — Page Détail d'une pièce

```
Dans apps/web/src/app/(app)/documents/[id]/, crée la page de détail.

Layout : 2 colonnes sur desktop (image gauche, détails droite), 1 colonne sur mobile

Colonne gauche — Visionneuse :
- Pour PDF : react-pdf ou iframe
- Pour images : img avec zoom (react-medium-image-zoom)
- Bouton télécharger l'original

Colonne droite — Extraction et écriture :

Section "Données extraites" :
- Formulaire en lecture (ou éditable si statut NEEDS_REVIEW/EXTRACTED)
- Champs : Fournisseur, Date, N° facture, HT, TVA (taux), TTC, Devise
- Score de confiance global + par champ (tooltip avec explication IA)
- Si NEEDS_REVIEW : banner orange "Vérification requise" avec motif

Section "Écriture générée" :
- Tableau débit/crédit avec colonnes : Compte, Libellé, Débit, Crédit
- Indicateur d'équilibre : ΣD = ΣC avec check vert

Section "Actions" :
- Si NEEDS_REVIEW ou EXTRACTED :
  - Bouton "Valider" (vert, confirmation dialog)
  - Bouton "Corriger et valider" (ouvre le formulaire en mode édition)
  - Bouton "Rejeter" (rouge, dialog avec champ motif obligatoire)
- Si POSTED :
  - Bouton "Annuler par contre-passation" (dialog d'avertissement)

Section "Historique IA" (collapsible) :
- Timeline des ExtractionAttempt : date, modèle, confiance, tokens, coût USD
- Indicateur succès/échec par tentative

Section "Analytique" (si POSTED) :
- Affiche les axes analytiques et leur ventilation
```

---

### Prompt 2.6 — Pages États financiers

```
Crée les 4 pages d'états financiers.

Composant partagé components/reports/ReportTable.tsx :
- Table générique avec colonnes configurables
- Ligne de total automatique
- Formatage des montants XOF (séparateurs milliers, 0 décimale)
- Mise en évidence des soldes négatifs en rouge
- Bouton export (PDF / XLSX / CSV) → appelle GET /reports/[type]?format=xlsx

/reports/balance/page.tsx :
- DatePicker "Au..." pour choisir la date de référence
- Tableau : Code | Libellé | Total Débit | Total Crédit | Solde
- Filtrable par classe de compte (1-8)
- Ligne de total général avec vérification ΣD = ΣC

/reports/pnl/page.tsx :
- DateRangePicker "Du... Au..."
- Structure SYSCOHADA :
  Section "Charges d'exploitation" (classe 6 regroupée)
  Section "Produits d'exploitation" (classe 7 regroupée)
  Ligne "Résultat d'exploitation"
  Section "Charges financières"
  Section "Produits financiers"
  Ligne "Résultat net"
- Comparaison N vs N-1 (optionnel, bouton toggle)

/reports/balance-sheet/page.tsx :
- Date de référence
- 2 colonnes : Actif | Passif
- Structure SYSCOHADA (classes 1-5)
- Vérification Actif = Passif avec badge vert

/ledger/page.tsx (Grand Livre) :
- Sélecteur de compte (autocomplete sur plan comptable)
- DateRangePicker
- Tableau : Date | Libellé | Pièce | Débit | Crédit | Solde progressif
- Chaque ligne "Pièce" est un lien cliquable vers la page document/:id
- Solde initial affiché en tête de tableau
```

---

### Prompt 2.7 — Dashboard

```
Dans apps/web/src/app/(app)/dashboard/, crée le dashboard temps réel.

page.tsx : grille de KPIs et graphiques, rechargement auto toutes les 60 secondes

components/dashboard/KPICard.tsx :
Props : { title, value, unit, trend?, trendLabel?, alert?, icon }
- Affiche la valeur principale avec unité (XOF formaté)
- Tendance vs période précédente (flèche verte/rouge + %)
- Si alert=true : bordure orange + icône d'alerte

KPIs à afficher :
1. Trésorerie disponible (solde comptes 521xxx)
2. Chiffre d'affaires mois courant (classe 7)
3. Charges mois courant (classe 6)
4. Marge brute (CA - Charges)
5. Pièces en attente de validation (NEEDS_REVIEW count) — alerte si > 0
6. Pièces en traitement (PROCESSING count)

components/dashboard/TrendChart.tsx :
- Recharts LineChart ou BarChart
- Données mensuelles sur 12 mois glissants
- Deux séries : CA vs Charges
- Tooltip avec valeurs XOF formatées

components/dashboard/TopSuppliersTable.tsx :
- Top 5 fournisseurs du mois par montant total facturé
- Colonne : Fournisseur | Nb factures | Total HT | Évolution vs mois précédent

components/dashboard/AlertBanner.tsx :
- Affiché si des pièces sont en NEEDS_REVIEW depuis > 24h
- Message : "X pièce(s) nécessitent votre attention" + bouton "Voir dans l'Inbox"
```

---

### Prompt 2.8 — Copilote IA Chat

```
Dans apps/web/src/components/chat/, crée l'interface du copilote IA.

ChatPanel.tsx (conteneur principal) :
- Drawer / panneau latéral selon la largeur d'écran
- En-tête avec titre "Copilote AI Compta" + bouton fermer
- Zone de messages (scroll automatique vers le bas)
- Barre de saisie en bas (fixe)
- Gère le streaming SSE depuis POST /api/chat

MessageBubble.tsx :
Props : { message: ChatMessage }
- Bulle utilisateur : alignée à droite, fond bleu primaire
- Bulle assistant : alignée à gauche, fond gris clair
- Support Markdown dans les réponses assistant (react-markdown)
- Horodatage discret sous chaque bulle

ToolCallView.tsx :
- S'affiche pendant le streaming quand le LLM appelle un outil
- Indicateur animé "Recherche dans les écritures..." / "Calcul de la balance..."
- Icône correspondant au tool (search, calculator, chart, etc.)
- Se collapse automatiquement une fois la réponse arrivée
- Cliquable pour voir le détail des paramètres (accordéon)

SourceLink.tsx :
- Chip cliquable avec icône de lien
- Exemples : "3 factures trouvées", "Balance au 31/05/2025"
- Au clic : ouvre la page concernée ou un dialog de détail

StreamingIndicator.tsx :
- Curseur clignotant pendant le streaming
- Barre de progression tokens (discrète, en dessous de la bulle)

Barre de saisie :
- Textarea autoredimensionnable (1 à 5 lignes)
- Suggestions de questions prédéfinies (chips au-dessus de la saisie) :
  "Total achats ce mois" | "Trésorerie disponible" | "Top fournisseurs" | "Projection T3"
- Bouton envoi désactivé si vide ou si réponse en cours
- Raccourci Entrée pour envoyer, Shift+Entrée pour saut de ligne

Gestion du streaming SSE (lib/api/chat.ts) :
- Utilise EventSource ou fetch avec ReadableStream
- Parse les chunks JSON: { type: 'text'|'tool_use'|'tool_result'|'done', content, ... }
- Accumule le texte et met à jour le state progressivement
- Sur type='done' : ajoute les sources cliquables sous le message final
- Gestion d'erreur : affiche message d'erreur inline si le stream s'interrompt
```

---

### Prompt 2.9 — Paramètres et gestion des membres

```
Dans apps/web/src/app/(app)/settings/, crée les pages de paramètres.

settings/page.tsx (Organisation) :
- Nom de l'organisation (éditable, OWNER uniquement)
- Slug (lecture seule, non modifiable après création)
- Email de l'inbox ({slug}@inbox.aicompta.app) avec bouton "Copier"
- Exercice fiscal courant (dates, statut)
- Quota IA : tokens utilisés ce mois / limite mensuelle (barre de progression)

settings/members/page.tsx :
- Tableau des membres : Avatar | Nom | Email | Rôle | Date d'invitation
- Bouton "Inviter un membre" (dialog avec email + sélecteur de rôle)
- Actions : changer le rôle, révoquer l'accès (OWNER uniquement, sauf sur lui-même)
- Invitation en attente (statut "Invité") visible séparément

settings/chart-of-accounts/page.tsx :
- Arborescence du plan comptable (classes 1-8)
- Recherche par code ou libellé
- Bouton "Ajouter un sous-compte" (sous-comptes auxiliaires uniquement)
- OWNER et ACCOUNTANT peuvent ajouter des comptes, pas modifier les comptes SYSCOHADA de base

settings/analytics/page.tsx :
- Liste des axes analytiques créés
- CRUD complet : créer un axe, ajouter des valeurs, archiver
- Exemples affichés : "Projet → [Site Abidjan, Site Dakar, HQ]"
```

---

## ÉTAPE 3 — Tests et finalisation

### Prompt 3.1 — Tests unitaires critiques (API)

```
Dans apps/api/tests/unit/, crée les tests unitaires avec Vitest.

lib/accounting/validators.test.ts :
- validateAmounts : 20 cas (valides, arrondi, inversion HT+TVA, TVA=0, montants nuls)
- validateJournalBalance : 10 cas (équilibré, déséquilibre, lignes vides)
- validateTvaRate : tous les taux valides + tous les taux invalides

lib/accounting/journal.test.ts :
- buildPurchaseInvoiceEntry : 5 cas (TVA 18%, TVA 0%, exonéré, multilignes, note de frais)
- buildSalesInvoiceEntry : 3 cas
- buildReversalEntry : vérifie que D et C sont inversés, que la somme reste équilibrée

lib/accounting/reports/balance.test.ts :
- getBalance : vérifie cohérence sur un jeu de données fixe
- Vérifie que ΣDebit = ΣCredit dans la balance retournée

lib/extraction/validators.test.ts (tests de propriétés avec fast-check) :
- Pour tout triplet (ht, tva, ttc) généré aléatoirement :
  Si ht + tva = ttc (avec tolérance) → validateAmounts ne lève pas d'erreur
  Si ht + tva ≠ ttc → validateAmounts lève toujours une erreur

lib/db/tenant.test.ts :
- withOrg() sans orgId → lève ForbiddenError
- withOrg() avec orgId vide → lève ForbiddenError
- withOrg() avec orgId valide → exécute la fonction

Couverture cible : ≥ 75 % sur lib/accounting/ et lib/extraction/
```

---

### Prompt 3.2 — Tests d'intégration (API)

```
Dans apps/api/tests/integration/, crée les tests d'intégration avec Vitest.

Prérequis : base de test PostgreSQL isolée, seeded avec plan SYSCOHADA.

documents.integration.test.ts :
- POST /documents : upload PDF valide → 202 + documentId
- POST /documents : upload du même PDF → 409
- POST /documents : upload fichier .exe → 415
- POST /documents : fichier > 25 Mo → 413
- GET /documents : retourne uniquement les documents de l'org courante (test isolation tenant)
- POST /documents/:id/validate : document NEEDS_REVIEW → POSTED + écriture persistée
- POST /documents/:id/reject : motif trop court → 400

extraction.integration.test.ts (mock Anthropic) :
- Mock l'API Anthropic pour retourner une extraction connue
- Vérifie que l'écriture générée est équilibrée (ΣD = ΣC)
- Vérifie que les montants en BDD sont des Decimal (pas des float)
- Facture avec HT+TVA ≠ TTC → statut NEEDS_REVIEW, pas d'écriture persistée

reports.integration.test.ts :
- Seed 50 écritures depuis samples/
- Vérifie que la balance générée est équilibrée
- Vérifie la cohérence du P&L (résultat = produits - charges)
- Vérifie que Actif = Passif dans le bilan

tenant.integration.test.ts :
- Crée 2 organisations avec des documents distincts
- Vérifie que l'org A ne peut pas accéder aux documents de l'org B
- Vérifie que chaque endpoint retourne 403 sur une tentative cross-tenant
```

---

### Prompt 3.3 — Tests E2E Playwright

```
Dans apps/web/tests/e2e/, crée les tests Playwright.

playwright.config.ts :
- baseURL : http://localhost:3000
- Lance apps/api et apps/web en dev avant les tests
- Screenshots en cas d'échec
- Timeout 30 secondes par test

auth.spec.ts :
- Inscription → magic link simulé → connexion → dashboard visible
- Accès à /inbox sans être connecté → redirect vers /login

upload.spec.ts :
- Upload d'une facture PDF de samples/ → statut PENDING visible dans l'Inbox
- Attente (polling) que le statut passe à EXTRACTED ou NEEDS_REVIEW (timeout 30s)
- Double upload du même fichier → message d'erreur "doublon détecté"

validation.spec.ts :
- Document en NEEDS_REVIEW → clic "Valider" → dialog confirmation → statut POSTED
- Document en NEEDS_REVIEW → clic "Rejeter" → motif trop court → erreur inline

reports.spec.ts :
- Navigation vers Balance → tableau visible, total D = total C affiché
- Navigation vers Compte de résultat → structure en charges/produits visible

chat.spec.ts :
- Ouvrir le panel chat → saisir "Quel est mon total d'achats ce mois ?" → réponse avec montant
- Vérifier qu'une source cliquable apparaît sous la réponse
```

---

### Prompt 3.4 — Docker Compose et README

```
À la racine du projet, crée :

docker-compose.yml :
- Service postgresql :
  image: postgres:15
  environment: POSTGRES_DB=aicompta_dev, POSTGRES_USER=postgres, POSTGRES_PASSWORD=password
  ports: 5432:5432
  volume pour persistance locale

- Service redis :
  image: redis:7-alpine
  ports: 6379:6379

- Service minio (stockage local équivalent R2) :
  image: minio/minio
  command: server /data --console-address ":9001"
  ports: 9000:9000, 9001:9001
  variables MINIO_ROOT_USER=minioadmin, MINIO_ROOT_PASSWORD=minioadmin

Tous les services avec healthcheck.

README.md complet :
# AI Compta

## Prérequis
- Node.js 20+
- npm 8+
- Docker + Docker Compose

## Démarrage en moins de 10 minutes

# 1. Clone et installation
git clone ... && cd aicompta
npm install

# 2. Variables d'environnement
cp .env.example .env
# Renseigner au minimum : ANTHROPIC_API_KEY

# 3. Lancer les services
docker-compose up -d

# 4. Base de données
npm --filter @aicompta/api db:migrate
npm --filter @aicompta/api db:seed

# 5. Démarrer l'app
npm dev
# API : http://localhost:3001
# Web : http://localhost:3000
# Worker : npm --filter @aicompta/api dev:worker (terminal séparé)

## Structure du projet
[description de l'arborescence]

## Architecture
[description API séparée vs Frontend]

## Tests
npm test          # Unit + intégration
npm test:e2e      # Playwright (nécessite l'app lancée)

## Déploiement
[instructions Vercel pour apps/web + Railway pour apps/api + worker]
```

---

### Prompt 3.5 — CI/CD GitHub Actions

```
Dans .github/workflows/, crée les pipelines CI.

ci.yml (déclenché sur push main et toutes les PRs) :
Jobs en parallèle :
1. lint-typecheck :
   - npm install
   - npm turbo lint
   - npm turbo typecheck

2. test-unit :
   - npm install
   - Services : postgres:15, redis:7
   - npm --filter @aicompta/api db:migrate
   - npm turbo test
   - Upload coverage à Codecov

3. build :
   - npm install
   - npm turbo build
   - Vérifie que le build ne produit pas d'erreurs TypeScript

4. test-e2e (après les 3 jobs précédents) :
   - Démarre l'app complète
   - npm --filter @aicompta/web test:e2e
   - Upload screenshots Playwright en artefacts

deploy.yml (déclenché uniquement sur push main, après CI verte) :
1. Deploy apps/web sur Vercel (via CLI Vercel)
2. Deploy apps/api sur Railway (via Railway CLI ou webhook)
3. Run migrations sur la BDD production

Secrets requis : VERCEL_TOKEN, RAILWAY_TOKEN, DATABASE_URL_PROD
```

---

## Ordre d'exécution recommandé

Exécute les prompts dans cet ordre pour avoir une base stable le plus tôt possible :

```
0.1 → 0.2 → 0.3          Monorepo + types partagés (1 jour)
1.1 → 1.2 → 1.3          Base API + Prisma + logique comptable (2 jours)
1.4 → 1.5 → 1.6          Extraction IA + Queue + Routes documents (2 jours)
1.7 → 1.8 → 1.9          Routes complètes + Copilote + Auth (2 jours)
2.1 → 2.2 → 2.3          Frontend base + Auth + Layout (2 jours)
2.4 → 2.5                Inbox + Détail pièce (1 jour)
2.6 → 2.7                États financiers + Dashboard (1 jour)
2.8 → 2.9                Chat IA + Paramètres (1 jour)
3.1 → 3.2 → 3.3          Tests (2 jours)
3.4 → 3.5                Docker + CI/CD (1 jour)
```

**Total estimé : ~15 jours de développement intensif pour un dev solo.**

---

## Checklist avant de marquer la v1.0 comme stable

- [ ] `npm turbo typecheck` → 0 erreur TypeScript
- [ ] `npm turbo lint` → 0 warning ESLint
- [ ] `npm turbo test` → tous verts, couverture ≥ 75 %
- [ ] `npm test:e2e` → tous les flows critiques verts
- [ ] Upload d'une facture réelle → écriture SYSCOHADA correcte en < 15 s
- [ ] Test doublon (même fichier) → 409 sans nouvelle extraction
- [ ] Test cross-tenant manuel → 0 fuite de données
- [ ] Question chat "total achats du mois" → réponse correcte avec sources
- [ ] `docker-compose up` + seed → app fonctionnelle en < 10 min sur machine vierge
- [ ] Variables d'environnement manquantes → boot échoue avec message explicite
- [ ] Aucun `number` flottant dans les calculs financiers (grep `parseFloat\|Math\.` dans `lib/accounting/`)
- [ ] Aucun accès Prisma sans `withOrg()` (grep `prisma\.\w*\.(find\|create\|update\|delete)` hors `tenant.ts`)