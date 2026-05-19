# TP Agile & DevOps - Équipe 1

> **EPSI Nantes** - Promotion 2025-2026 - Cursus DEVIA
> **Formateur / Client :** Kevin Niel
> **Sujet :** [github.com/kevinniel/2526-EPSINANTES-DEVIA-AGILE](https://github.com/kevinniel/2526-EPSINANTES-DEVIA-AGILE/blob/main/tp.md)

## Composition de l'équipe

| Membre    | Rôle Scrum       |
|-----------|------------------|
| Nathan    | Product Owner    |
| Jihad     | Scrum Master     |
| Arthur    | Dev Team         |
| Aurélien  | Dev Team         |
| Thomas    | Dev Team         |

## Projet : ImmoMatch

Plateforme immobilière simple (annonces + recherche + favoris + messagerie + génération IA de descriptions).
La fiche projet et le Product Backlog complet sont gérés par le PO (Nathan).

## Stack technique

| Couche | Techno |
|--------|--------|
| Framework | Next.js 16 + React 19 + TypeScript (App Router) |
| Styling | Tailwind CSS 4 |
| UI components | shadcn/ui (sur base-ui) |
| Auth + DB + Storage | Supabase (via `@supabase/ssr`) |
| IA (Sprint 3) | Mistral SDK (US-12) |
| Tests | Vitest + Testing Library |
| Linting | ESLint 9 |

## Installation locale

```bash
# 1. Cloner et installer
git clone https://github.com/ArthurPoncin/agile-devops-tp.git
cd agile-devops-tp
npm install

# 2. Configurer les variables d'environnement
cp .env.local.example .env.local
# puis renseigner NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# 3. Lancer le dev server
npm run dev
```

App dispo sur `http://localhost:3000`.

### Setup Supabase (premier lancement)

1. Créer un projet sur https://supabase.com
2. *Settings → API* : récupérer `Project URL` + **Publishable key** (`sb_publishable_*`, PAS la secret) → coller dans `.env.local`
3. *Authentication → Providers → Email* : activer Email, **désactiver Confirm email** (pas de SMTP en MVP)
4. *Storage → New bucket* : créer le bucket **`listings`** en **Public**
5. *SQL Editor → New query* : coller le contenu de [`supabase/schema.sql`](supabase/schema.sql) → Run

## Scripts utiles

| Commande | Effet |
|----------|-------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Build de prod |
| `npm run start` | Lancer le build de prod |
| `npm run lint` | Lint ESLint |
| `npm test` | Tests Vitest en mode watch |
| `npm run test:run` | Tests Vitest one-shot |

## Organisation du dépôt

- [`docs/project-card.md`](docs/project-card.md) - Fiche projet (cadrage)
- [`docs/product-backlog.md`](docs/product-backlog.md) - Product Backlog, DoR, DoD
- [`docs/sprints/`](docs/sprints/) - Artefacts de chaque sprint : Planning, Daily, Review, Rétrospective

## Méthodologie Scrum

| Cérémonie         | Quand                     | Livrable                            |
|-------------------|---------------------------|-------------------------------------|
| Sprint Planning   | Début de sprint           | Sprint Goal + Sprint Backlog        |
| Daily Scrum       | Quotidien                 | Suivi blocages                      |
| Sprint Review     | Fin de sprint             | Démo + feedback client              |
| Rétrospective     | Fin de sprint             | Keep / Drop / Try                   |

**Estimation :** Fibonacci `1, 2, 3, 5, 8, 13, 21, 34, 55, 89` (toute US ≥ 21 doit être redécoupée).

## Suivi

- **Kanban** : voir l'onglet *Projects* du repo (6 colonnes : Product Backlog → Sprint Backlog → In Progress → Review → Done → 🚫 Cancelled)
- **Issues** : chaque User Story = une issue avec labels `type/user-story`, `priority/*`, `sprint/*`, `estimate/*`
