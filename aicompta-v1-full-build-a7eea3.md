# AI Compta v1 — Plan d'implémentation complet

Échafaudage complet du monorepo AI Compta (étapes 0 → 3 du guide `int.md`) en une seule itération, avec MinIO en stockage local et un extracteur mock activé en l'absence de `ANTHROPIC_API_KEY`.

## Hypothèses & choix techniques

- **Stockage** : MinIO via `docker-compose` (compatible S3 — SDK `@aws-sdk/client-s3`), endpoint configurable pour basculer plus tard vers R2 sans changer le code.
- **IA** : `ClaudeExtractor` réel + `MockExtractor` (factory `getExtractor()` choisit selon `ANTHROPIC_API_KEY`). Même comportement pour le copilote chat (réponses stub si pas de clé).
- **Runtime** : Node.js 20, npm workspaces + Turborepo, TS strict.
- **DB** : PostgreSQL 15, Prisma 5, Decimal partout (`decimal.js`).
- **Queue** : BullMQ + Redis, worker dans un process séparé (`apps/api/src/workers/index.ts`).
- **Auth** : Better-Auth (Prisma adapter, plugins `organization` + `magicLink`), JWT 7j, cookie httpOnly côté Next.
- **Frontend** : Next.js 14 App Router, Tailwind, shadcn/ui, react-hook-form + Zod, Recharts, react-dropzone, react-pdf, react-markdown.

## Arborescence cible

```
aicompta_v1/
├── apps/
│   ├── api/   (Express + Prisma + BullMQ worker)
│   └── web/   (Next.js 14)
├── packages/
│   ├── types/        (@aicompta/types)
│   └── validators/   (@aicompta/validators)
├── docker-compose.yml  (postgres + redis + minio)
├── turbo.json
├── package.json (workspaces)
├── .env.example
└── README.md
```

## Étapes d'exécution

### Phase 0 — Monorepo & packages partagés
1. **Scaffold racine** : `package.json` (workspaces `apps/*`, `packages/*`), `turbo.json` (pipelines build/dev/lint/test/typecheck), `.gitignore`, `.env.example`, `tsconfig.base.json` (`strict`, `noUncheckedIndexedAccess`), README.
2. **`packages/types`** : `enums.ts`, `models.ts`, `api.ts`, `extraction.ts`, `index.ts`.
3. **`packages/validators`** : schémas Zod (`document`, `journal`, `reports`, `chat`, `auth`, `env` avec `parseEnv()`), `index.ts`.

### Phase 1 — Backend API (`apps/api`)
4. **Structure Express** : `index.ts`, `app.ts`, `config/env.ts`, `lib/db/{prisma,tenant}.ts`, `lib/{logger,errors,response}.ts`, middlewares `auth/tenant/validate/rateLimit`, `routes/index.ts`, `workers/index.ts`. CORS+Helmet+Compression+Pino+requestId, `/health`, `AppError` hierarchy, helpers `success()`/`error()`, `withOrg()` strict.
5. **Prisma schema** : tous les modèles du guide, Decimal(20,4), index composites, trigger SQL `SUM(debit)=SUM(credit)` via migration raw. `seed.ts` (org Demo SARL + user + plan SYSCOHADA ~50 comptes + fiscal year 2025-2026).
6. **`lib/accounting/`** : `chart-of-accounts.ts` (+ `SYSCOHADA_DEFAULT_MAPPING`), `validators.ts`, `journal.ts` (builders achat/vente/note de frais/contre-passation), `reports/{balance,pnl,balance-sheet,general-ledger}.ts`.
7. **`lib/extraction/`** : `types.ts`, `classifier.ts` (heuristique + Haiku fallback), `claude.ts` (`ClaudeExtractor` avec forced tool use), `mock.ts` (`MockExtractor`), `system-prompts.ts`, `index.ts` (`getExtractor()` factory + `processDocument()` orchestrant DL R2/MinIO → classify → extract → validate → build entry → persist atomique).
8. **`lib/queue/`** : `connection.ts` (Redis singleton + `extractionQueue` + `addExtractionJob`), `jobs/extract-document.ts`. `workers/index.ts` (concurrency 3, graceful shutdown SIGTERM).
9. **Routes documents** : `upload` (multer + hash SHA-256 + dédup + upload MinIO + job), `list`, `detail` (URL signée 15min), `validate`, `reject`, `reextract`.
10. **Routes journal/reports/chat/email-inbound** : `journal-entries` (list + cancel via reversal), `reports/*` (json/csv/xlsx via `exceljs`), `chat` (SSE stream Anthropic ou mock), webhook Resend HMAC.
11. **`lib/ai/`** : `tools/definitions.ts` (8 outils Zod), `tools/handlers.ts` (orgId injecté serveur), `guards.ts` (`injectOrgId`, `validateTokenBudget`, `sanitizeToolError`), `system-prompts.ts`, `chat.ts` (`processChatMessage` async generator).
12. **Auth Better-Auth** : `lib/auth/{config,middleware}.ts` (`requireAuth`, `requireRole` avec ordre VIEWER<ACCOUNTANT<OWNER), routes `signup/magic-link/verify/invite/members/me/logout`, rate-limit 5/min, emails FR via Resend.

### Phase 2 — Frontend (`apps/web`)
13. **Init Next.js 14 + shadcn/ui** : structure `app/(auth)`, `app/(app)`, `components/{ui,layout,documents,ledger,reports,dashboard,chat}`, `lib/{api,auth,hooks,utils}`. Palette OHADA dans `globals.css`. `ApiClient` singleton avec gestion 401/403/429, cookie session.
14. **Pages Auth** : `login`, `signup` (slug debounce), `verify`, `middleware.ts` (protection `(app)`).
15. **Layout principal** : `Sidebar` (navigation groupes Compta / États / Analytique / Paramètres), `Header` (titre + date range + upload rapide), `ChatPanel` (drawer/panneau ≥1280px persistant entre routes).
16. **Inbox** : `Uploader` (react-dropzone, polling statut), `DocumentCard`, `StatusBadge` (8 statuts), filtres (statut multi, période, type, search), pagination.
17. **Détail pièce `/documents/[id]`** : visionneuse PDF/image (react-pdf + zoom), formulaire extraction éditable, tableau écriture D/C avec check équilibre, actions contextuelles selon statut, historique IA, analytique.
18. **Reports** : `ReportTable` générique + 4 pages (`balance`, `pnl`, `balance-sheet`, `ledger`), export PDF/XLSX/CSV via API.
19. **Dashboard** : `KPICard`, `TrendChart` (Recharts 12 mois), `TopSuppliersTable`, `AlertBanner`. Refresh auto 60s.
20. **Chat UI** : `ChatPanel`, `MessageBubble` (markdown), `ToolCallView`, `SourceLink`, `StreamingIndicator`, parser SSE (`lib/api/chat.ts`), suggestions prédéfinies.
21. **Settings** : org, members (invite/role/revoke), chart-of-accounts (arbo 1-8 + sous-comptes), analytics (axes + valeurs).

### Phase 3 — Tests & finalisation
22. **Tests unitaires API** (Vitest) : `validators` (avec fast-check), `journal builders`, `reports.balance`, `tenant.withOrg`. Cible ≥75% sur `lib/accounting` + `lib/extraction`.
23. **Tests intégration API** : documents (upload/dédup/format/taille/isolation tenant/validate/reject), extraction (mock Anthropic), reports (cohérence balance/P&L/bilan), tenant cross-org.
24. **E2E Playwright** : `auth`, `upload`, `validation`, `reports`, `chat`. `playwright.config.ts` lance api+web.
25. **Docker Compose** : postgres15 + redis7 + minio (avec healthchecks) + volumes.
26. **README** : démarrage < 10min, structure, architecture, tests, déploiement (Vercel + Railway).
27. **CI/CD GitHub Actions** : `ci.yml` (lint+typecheck / unit+intégration avec services / build / e2e), `deploy.yml` (Vercel + Railway + migrations prod, déclenché sur `main`).

## Livrables clés / critères d'acceptation

- `npm install` + `docker-compose up -d` + `npm --filter @aicompta/api db:migrate && db:seed` + `npm dev` → app fonctionnelle.
- `npm turbo typecheck` et `npm turbo lint` → 0 erreur.
- `npm turbo test` → tests verts, couverture ≥75% sur les modules cibles.
- Upload facture PDF (avec `MOCK` extractor) → écriture SYSCOHADA équilibrée persistée.
- Cross-tenant : aucun accès aux données d'une autre org.
- Boot échoue avec message clair si variables `.env` obligatoires manquent.
- Aucun `parseFloat` / `Math.*` dans `apps/api/src/lib/accounting/`.

## Points de vigilance

- **Decimal partout** côté serveur, **string** dans les DTOs réseau.
- **`withOrg()` obligatoire** pour chaque accès Prisma métier (lint custom optionnel via ESLint rule à considérer).
- **Immutabilité** : aucun `DELETE` métier (contre-passation uniquement).
- **Trigger SQL** d'équilibre comptable créé via migration raw Prisma.
- **SSE** côté Express : désactiver compression sur la route `/chat`.
- **Better-Auth + Prisma** : vérifier compatibilité version au moment de l'install (fallback : implémentation magic link maison si bloqué).
- **MinIO** : URLs signées via `@aws-sdk/s3-request-presigner` (mêmes APIs que R2).

## Volumétrie estimée

~60-80 fichiers backend, ~70-90 fichiers frontend, ~15 fichiers tests, ~10 fichiers infra/CI. Implémentation séquentielle phase par phase avec commits logiques entre chaque étape numérotée pour faciliter la revue.
