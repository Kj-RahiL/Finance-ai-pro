# FinanceAI Pro

AI-powered personal finance manager. Log transactions in plain language
(`KFC 550`) and Claude auto-categorizes them — saved to Postgres, shown in a
Next.js UI with an **✨ AI suggested** badge.

This repo is a **full-stack scaffold + one complete vertical slice**
(register/login → add transaction → AI category → list). It's structured to
grow into the larger platform (budgets, receipts, RAG chat, etc.).

```
Finance-ai-pro/
├── docker-compose.yml     # local Postgres 16
├── server/                # FastAPI + SQLAlchemy 2.0 (async) + Alembic + Anthropic
└── client/                # Next.js (App Router) + Tailwind + Framer Motion + TanStack Query
```

## Stack

| Layer     | Tech |
|-----------|------|
| Backend   | Python 3.11+, FastAPI, SQLAlchemy 2.0 (async, `asyncpg`), Alembic, PyJWT, bcrypt |
| AI        | Anthropic Claude via the `anthropic` SDK (structured outputs) |
| Database  | Postgres 16 (Docker) — or zero-install SQLite fallback |
| Frontend  | Next.js 15, TypeScript, Tailwind CSS, Framer Motion, TanStack Query, Zustand, React Hook Form + Zod |

## Prerequisites

- **Python 3.11+**, **Node.js 18+**, and (optional) **Docker Desktop** for Postgres.
- An **Anthropic API key** for the AI feature — *optional*: without one, transactions
  still save and are categorized as `Other` (graceful degradation).

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
- `DATABASE_URL` — leave as Postgres if you ran Docker; or switch to the commented
  SQLite line for zero setup.
- `JWT_SECRET` — set a long random value.
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

The smoke test runs the whole slice against an isolated SQLite DB with the AI
call stubbed — no network or API key needed.

---

## 2. Frontend (`client/`)

```bash
cd client
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open <http://localhost:3000> → register → add an expense like **KFC / 550** →
watch it appear categorized **Food** with the **✨ AI suggested** badge.
Try `Uber 300` (→ Transport), `bKash bill 1200` (→ Bills).

---

## Database migrations (Alembic)

The app auto-creates tables on startup for convenience. To manage schema with
migrations instead:

1. Set `AUTO_CREATE_TABLES=false` in `.env` (so startup doesn't pre-create tables).
2. Run the bundled initial migration against a fresh database:

   ```bash
   cd server
   alembic upgrade head
   ```

To evolve the schema later, edit the models and autogenerate a revision:

```bash
alembic revision --autogenerate -m "add budgets"
alembic upgrade head
```

> Already created tables with `AUTO_CREATE_TABLES=true` and now want Alembic?
> Run `alembic stamp head` once to mark the initial migration as applied.

---

## How the AI categorization works

`server/app/services/ai_categorizer.py`:

- Sends the description + amount to Claude and requests a **structured output**
  constrained to the seeded category set (`messages.parse()` with a Pydantic
  model, falling back to a raw `json_schema` if needed).
- Maps the returned category name directly to a `category_id` and stores
  `ai_suggested=true`.
- **Never 500s on AI failure:** missing key, API error, or an unexpected answer
  degrades to `Other` with `ai_suggested=false` (logged as a warning).

Model is set by `ANTHROPIC_MODEL` (default `claude-opus-5`). For this
high-volume classification, `claude-haiku-4-5` is cheaper and plenty capable.

### Resilience check

Blank out `ANTHROPIC_API_KEY`, restart the backend, and add a transaction — it
saves as `Other` with no error, proving the fallback path.

---

## API summary

| Method | Path                | Auth | Purpose |
|--------|---------------------|------|---------|
| POST   | `/auth/register`    | –    | Create user (+ default Cash account), return JWT |
| POST   | `/auth/login`       | –    | Return JWT |
| GET    | `/auth/me`          | ✓    | Current user |
| GET    | `/categories`       | ✓    | List seeded categories |
| GET    | `/transactions`     | ✓    | List the user's transactions (newest first) |
| POST   | `/transactions`     | ✓    | Create + AI-categorize a transaction |
| GET    | `/health`           | –    | Liveness check |

Auth is JWT Bearer: the client stores the token (Zustand, persisted to
localStorage) and sends `Authorization: Bearer <token>` on each request.

---

## Not yet built (future phases)

Receipt OCR, RAG chat (pgvector), ML prediction, budgets/alerts, recurring
payments, dashboard charts, exports, notifications, background jobs, OAuth/MFA.
The folder structure and data model leave seams to add these.
