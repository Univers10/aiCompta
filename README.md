# AI Compta

> Comptabilité automatisée pour la zone OHADA — conforme SYSCOHADA Révisé.
> Backend Express + Frontend Next.js + extraction IA (Claude / Mock) + queue BullMQ.

## Prérequis

- **Node.js 20+** et **npm 8+**
- **Docker** + **Docker Compose** (pour PostgreSQL, Redis, MinIO en local)

## Démarrage en moins de 10 minutes

```bash
# 1. Installation
git clone <repo> aicompta
cd aicompta
npm install

# 2. Variables d'environnement
cp .env.example .env
# (optionnel) éditer .env pour ajouter ANTHROPIC_API_KEY
# Sans clé Anthropic : l'extracteur MOCK est activé automatiquement.

# 3. Services Docker (PostgreSQL + Redis + MinIO)
docker compose up -d

# 4. Base de données : migrations + plan SYSCOHADA + organisation de démo
npm --workspace @aicompta/api run db:generate
npm --workspace @aicompta/api run db:migrate
npm --workspace @aicompta/api run db:seed

# 5. Démarrer le tout (API + Worker + Web dans des terminaux séparés)
npm --workspace @aicompta/api run dev          # API sur :3001
npm --workspace @aicompta/api run dev:worker   # Worker BullMQ
npm --workspace @aicompta/web run dev          # Web sur :3000
```

Connectez-vous avec `demo@aicompta.app` (un magic link sera affiché dans la console
si `RESEND_API_KEY` est vide).

## Structure du projet

```
aicompta/
├── apps/
│   ├── api/          Express + Prisma + BullMQ
│   │   ├── src/      Code source (routes, lib, middleware, workers)
│   │   ├── prisma/   Schema + migrations + seed
│   │   └── tests/    Tests Vitest
│   └── web/          Next.js 14 (App Router)
│       ├── src/app/  Pages
│       ├── src/components/
│       └── src/lib/
├── packages/
│   ├── types/        Types TypeScript partagés (@aicompta/types)
│   └── validators/   Schémas Zod partagés (@aicompta/validators)
├── docker-compose.yml
├── turbo.json
└── .env.example
```

## Architecture

- **Backend API** (`apps/api`) — Express stateless, Prisma → PostgreSQL,
  BullMQ → Redis, stockage S3-compatible (MinIO en dev, Cloudflare R2 en prod).
- **Frontend Web** (`apps/web`) — Next.js 14 App Router, React 18, Tailwind,
  consomme l'API via `fetch` avec cookie de session `httpOnly`.
- **Worker** (`apps/api/src/workers`) — process Node séparé qui consomme la
  queue `extraction` (concurrence : 3 jobs simultanés).
- **Isolation tenant** : tous les accès Prisma métier passent par
  `withOrg(orgId, fn)` qui rejette les requêtes sans organisation.
- **Immutabilité comptable** : aucun `DELETE` sur les écritures.
  Annulation = contre-passation.

## Décimaux et devises

- Tous les montants sont des `Decimal` (`decimal.js`) côté serveur.
- Sérialisation en `string` dans les DTOs réseau.
- Devise par défaut : **XOF** (Franc CFA), sans décimales d'affichage.

## Tests

```bash
# Unitaires (Vitest) sur lib/accounting et lib/extraction
npm --workspace @aicompta/api run test

# E2E Playwright (lance API + Web automatiquement)
npm --workspace @aicompta/web run test:e2e

# Tout l'orchestrateur
npx turbo run test
```

Couverture cible : ≥ 75 % sur `lib/accounting/` et `lib/extraction/`.

## Variables d'environnement clés

| Variable | Description | Défaut |
|---|---|---|
| `DATABASE_URL` | PostgreSQL | `postgresql://postgres:password@localhost:5432/aicompta_dev` |
| `REDIS_URL` | Redis | `redis://localhost:6379` |
| `R2_ENDPOINT` | Endpoint S3 (MinIO/R2) | `http://localhost:9000` |
| `AUTH_SECRET` | Clé HMAC JWT (≥32 caractères) | — (obligatoire) |
| `ANTHROPIC_API_KEY` | Clé Claude — vide → MOCK | `''` |
| `AI_CONFIDENCE_THRESHOLD` | Seuil auto-validation | `0.85` |
| `MAX_UPLOAD_BYTES` | Taille max upload | `26214400` (25 Mo) |

Si une variable obligatoire manque, le boot échoue avec un message clair.

## Déploiement

- **Frontend** → Vercel (`apps/web`) avec `NEXT_PUBLIC_API_URL` pointant sur l'API
- **Backend** → Railway / Fly.io (`apps/api`) avec base PostgreSQL managée
- **Worker** → process séparé (`npm run start:worker`)
- **Stockage** → Cloudflare R2 (mêmes API S3, basculer `R2_*` env vars)

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | Node 20, Express 4, TypeScript strict, Prisma 5 |
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| DB | PostgreSQL 15 |
| Queue | BullMQ + Redis 7 |
| Stockage | S3-compatible (MinIO en dev, R2 en prod) |
| IA | Anthropic Claude Sonnet 4.5 (forced tool use) ou MockExtractor |
| Auth | JWT HMAC + magic link via Resend |
| Monitoring | Pino (logs JSON), requestId UUID, audit log |
| Tests | Vitest + fast-check + Playwright |

## Checklist v1.0 stable

- [x] `npm turbo typecheck` → 0 erreur TypeScript
- [x] Schéma Prisma complet avec trigger SQL d'équilibre des écritures
- [x] Tests unitaires (validators, journal builders, tenant, fast-check)
- [x] Tests Playwright pour les flows critiques
- [x] Docker Compose (postgres + redis + minio)
- [x] CI GitHub Actions (lint + typecheck + tests + build)
- [x] Boot échoue avec message clair si variables manquent
- [x] Aucun `parseFloat` / `Math.*` dans `lib/accounting/`
- [x] Multi-tenant strict via `withOrg()`
- [x] Immutabilité via contre-passation uniquement
