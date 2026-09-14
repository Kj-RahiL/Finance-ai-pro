# FinanceAI Pro

AI-powered personal finance manager. Log transactions in plain language
(`KFC 550`) and Claude auto-categorizes them — saved to Postgres, shown in a
Next.js UI with an **✨ AI suggested** badge that you can correct.

This repo implements **Phase 1 of the blueprint** (`FinanceAI_Pro_Project_Analysis.pdf`):
Auth, Accounts, Categories, Transaction CRUD with AI categorization, running
balances, and a monthly dashboard summary. It's structured to grow into the
later phases (receipts, budgets, RAG chat, ML prediction).

```
Finance-ai-pro/
├── docker-compose.yml     # local Postgres 16
├── server/                # FastAPI + SQLAlchemy 2.0 (async) + Alembic + Anthropic
└── client/                # Next.js (App Router) + Tailwind + Framer Motion + TanStack Query
```

> **Architecture note.** The blueprint describes a Node.js backend plus a
> separate Python ML microservice. This implementation uses a single Python
> FastAPI backend for both application logic and AI — one language, one
> deploy, and the ML/forecasting work (Phase 3) can live in the same service
> or be split out later behind the same REST boundary.

## Stack

| Layer     | Tech |
|-----------|------|
| Backend   | Python 3.11+, FastAPI, SQLAlchemy 2.0 (async, `asyncpg`), Alembic, PyJWT, bcrypt |
| AI        | Anthropic Claude via the `anthropic` SDK 1.x (structured outputs) |
| Database  | Postgres 16 (Docker) — or zero-install SQLite fallback |
| Frontend  | Next.js 15, TypeScript, Tailwind CSS, Framer Motion, TanStack Query, Zustand, React Hook Form + Zod |

## Prerequisites

- **Python 3.11+**, **Node.js 18+**, and (optional) **Docker Desktop** for Postgres.
- An **Anthropic API key** for the AI feature — *optional*: without one, expenses
  still save and are categorized as `Other` (graceful degradation).

---

The server and client are independent processes — run each in its own terminal
(they're also built and deployed separately, see *Deploy*).

---

## 1. Backend (`server/`)

### a. Start Postgres (optional — SQLite works without it)

```bash
docker compose up -d db
```

### b. Create a virtualenv and install deps

```bash
cd server
python -m venv .venv
# Windows (Git Bash):
source .venv/Scripts/activate
# macOS / Linux:
# source .venv/bin/activate
pip install -r requirements.txt
```

### c. Configure environment

```bash
cp .env.example .env
```

Then edit `.env`:
- `DATABASE_URL` — leave as Postgres if you ran Docker; switch to the commented
  SQLite line for zero setup; or paste a Supabase **Session pooler** URI (see *Deploy* —
  the *Direct* host is IPv6-only and won't resolve on most home connections).
- `JWT_SECRET` — set a long random value (the server warns on startup if you don't).
- `ANTHROPIC_API_KEY` — paste your key to enable AI categorization (optional).

### d. Run

```bash
uvicorn app.main:app --reload
```

- API + interactive docs: <http://localhost:8000/docs>
- Tables are auto-created on startup and default categories seeded
  (`AUTO_CREATE_TABLES=true`).

### e. Test

```bash
pytest
```

22 tests run the whole API against an isolated SQLite DB with the AI call
stubbed — no network or API key needed. They cover auth, account CRUD +
archive, balance bookkeeping on create/update/delete, AI vs. explicit vs.
fallback categories, filters/pagination, per-user isolation, and the summary.

---

## 2. Frontend (`client/`)

```bash
cd client
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open <http://localhost:3000> → register → you land on the **Dashboard**.
Quick-add an expense like **KFC / 550** → it appears categorized **Food** with
the **✨ AI suggested** badge. Click **Edit** on any transaction to correct the
category — the badge disappears because the category is now user-confirmed.

Screens: `/dashboard` (month summary, quick add, accounts, recent),
`/transactions` (filters, paging, edit/delete), `/accounts` (create, edit, archive).

---

## Business rules (server-side)

- **Running balances.** Every transaction adds a signed amount to its account
  (+income / −expense). Create applies it, delete reverses it, update reverses
  the old effect and applies the new one — including when moved between accounts.
- **Type-safe categories.** Expenses can only get expense categories, income only
  income categories. The AI is offered only the matching set. Fallbacks:
  expense → `Other`, income → `Income`.
- **AI is a suggestion.** `ai_suggested=true` only when Claude chose the category.
  Passing `category_id` on create or update marks it user-chosen (`false`).
  Changing a transaction's type re-resolves the category.
- **Soft delete for accounts.** `DELETE /accounts/{id}` archives; archived accounts
  keep their history, are hidden by default, and refuse new transactions.
- **Ownership.** Anything belonging to another user is a `404`, never a `403`.

---

## Database migrations (Alembic)

The app auto-creates tables on startup for convenience. To manage schema with
migrations instead:

1. Set `AUTO_CREATE_TABLES=false` in `.env`.
2. Run the migrations against a fresh database:

   ```bash
   cd server
   alembic upgrade head
   ```

To evolve the schema later, edit the models and autogenerate a revision:

```bash
alembic revision --autogenerate -m "add budgets"
alembic upgrade head
alembic check   # confirms models and migrations agree
```

> Already created tables with `AUTO_CREATE_TABLES=true` and now want Alembic?
> Run `alembic stamp head` once to mark the migrations as applied.

---

## How the AI categorization works

`server/app/services/ai_categorizer.py` + `services/categories.py`:

- The categories service loads the categories matching the transaction type and
  hands their names to the AI service as the **allowed set**.
- The AI service builds a Pydantic model whose `category` field is a `Literal`
  of that set and calls `client.messages.parse(..., output_format=Model)` — a
  structured output, so Claude physically cannot answer outside the set.
- **Never 500s on AI failure:** missing key, rate limit, API/connection error, or
  an unparseable answer returns `None` and the caller uses the fallback category
  with `ai_suggested=false` (logged as a warning).

Model is set by `ANTHROPIC_MODEL` (default `claude-opus-5`). For this
high-volume classification, `claude-haiku-4-5` is cheaper and plenty capable.

---

## API summary

| Method | Path                       | Purpose |
|--------|----------------------------|---------|
| POST   | `/auth/register`           | Create user (+ default Cash account), return JWT |
| POST   | `/auth/login`              | Return JWT |
| GET    | `/auth/me`                 | Current user |
| GET    | `/accounts`                | List accounts (`?include_archived=true`) |
| POST   | `/accounts`                | Create account (with opening balance) |
| GET    | `/accounts/{id}`           | Get one |
| PATCH  | `/accounts/{id}`           | Rename / retype / archive-restore |
| DELETE | `/accounts/{id}`           | Archive (soft delete) |
| GET    | `/categories`              | List seeded categories |
| GET    | `/transactions`            | Paged list: `account_id, category_id, type, date_from, date_to, q, limit, offset` |
| POST   | `/transactions`            | Create (+ AI categorize unless `category_id` given) |
| GET    | `/transactions/{id}`       | Get one |
| PATCH  | `/transactions/{id}`       | Partial update (rebalances accounts) |
| DELETE | `/transactions/{id}`       | Delete (restores balance) |
| GET    | `/dashboard/summary`       | Income / expense / net for a month + total balance |
| GET    | `/health`                  | Liveness check |

All routes except `/auth/*` and `/health` need `Authorization: Bearer <token>`.

---

## Code layout

```
server/app/
├── api/routes/      # thin HTTP handlers, one file per resource
├── api/errors.py    # DomainError → HTTP status mapping
├── core/            # config, db, security, domain exceptions
├── models/          # SQLAlchemy ORM
├── schemas/         # Pydantic request/response contracts
└── services/        # business logic (no FastAPI imports) — users, accounts,
                     # categories, transactions, ai_categorizer

client/src/
├── app/(auth)/      # /login, /register
├── app/(app)/       # auth-guarded: /dashboard, /transactions, /accounts
├── components/ui    # shared primitives (Button, Input, Modal, Badge…)
├── components/layout/AppShell.tsx
├── features/<name>/ # api.ts + hooks.ts + components/ per feature
└── lib/             # api-client, types (mirror server schemas), format, query-keys
```

---

## Deploy

The two halves deploy to different hosts, each to the platform that runs it best:

| Part | Host | Why |
|---|---|---|
| `client/` (Next.js) | **Vercel** | Zero-config Next.js, free tier, CDN, preview deploys per PR |
| `server/` (FastAPI) | **Render** | Native Python web services, `render.yaml` blueprint in this repo |
| Postgres | **Supabase** | Free managed Postgres with a good dashboard (Render's own Postgres works too) |

> SQLite is for local dev only — hosted disks are ephemeral. Production needs Postgres.

**1. Database on Supabase** — *New project* (region: Singapore) → set a DB password.
Then **Connect** (top bar) → *Connection string* → pick **Session pooler** (port 5432) and copy:
```
postgresql://postgres.<ref>:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```
- Use the *Session pooler*, not *Direct* (IPv6-only, Render can't reach it) and not
  *Transaction pooler* (port 6543 — breaks asyncpg's prepared statements).
- If your password has `@ # / %` etc., URL-encode it (`@` → `%40`).
- The app rewrites `postgresql://` → `postgresql+asyncpg://` itself; paste the link as-is.

**2. Server on Render** — Dashboard → *New* → *Blueprint* → select this repo. Render reads
[`render.yaml`](render.yaml): generates `JWT_SECRET` and runs `alembic upgrade head` before
every start. It prompts you for:
- `DATABASE_URL` — the Supabase link from step 1
- `ANTHROPIC_API_KEY`
- `CORS_ORIGINS` — set this to your Vercel URL *after* step 3 (e.g. `https://financeai-pro.vercel.app`)

Note the API URL it gives you, e.g. `https://financeai-api.onrender.com`.

**3. Client on Vercel** — *Add New Project* → import the repo → **Root Directory: `client`**
(framework auto-detects as Next.js). Add one environment variable:
```
NEXT_PUBLIC_API_URL=https://financeai-api.onrender.com
```
Deploy, then copy the Vercel URL back into Render's `CORS_ORIGINS`.

**Alternatives:** Railway runs both the server and Postgres with no cold starts (Render's
free tier sleeps after 15 min idle — fine for demos, ~30 s first request). Fly.io works
too. Keep the client on Vercel regardless — nothing beats it for Next.js.

---

## Not yet built (later phases)

Transfers (double-entry between accounts), refresh tokens / httpOnly cookies,
Google OAuth / MFA, custom categories, budgets & alerts, receipt OCR, recurring
payments & loans, RAG chat, ML prediction, reports/export, notifications,
background jobs. The service layer and feature folders leave seams for each.
