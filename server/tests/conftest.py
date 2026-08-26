"""Pytest fixtures — force a local SQLite DB and stub the AI before importing the app."""
import os

# Must be set before importing app.core.config (settings are cached at import).
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_financeai.db"
os.environ["ANTHROPIC_API_KEY"] = ""       # ensure no real API calls
os.environ["JWT_SECRET"] = "test-secret"
os.environ["AUTO_CREATE_TABLES"] = "true"

import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

import app.api.routes.transactions as txn_routes  # noqa: E402
from app.core.db import AsyncSessionLocal, Base, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.category import Category, CategoryType  # noqa: E402
from app.services.ai_categorizer import DEFAULT_CATEGORIES  # noqa: E402


@pytest_asyncio.fixture
async def client(monkeypatch):
    # Fresh schema per test.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    # Seed categories (lifespan doesn't run under ASGITransport).
    async with AsyncSessionLocal() as db:
        for name, ctype, icon in DEFAULT_CATEGORIES:
            db.add(Category(name=name, type=CategoryType(ctype), icon=icon))
        await db.commit()

    # Deterministic AI: pretend Claude classified everything as Food.
    async def fake_categorize(description, amount, txn_type):
        return "Food", True

    monkeypatch.setattr(txn_routes, "categorize_transaction", fake_categorize)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    await engine.dispose()
