"""Pytest fixtures — force a local SQLite DB and stub the AI before importing the app."""
import os

# Must be set before importing app.core.config (settings are cached at import).
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_financeai.db"
os.environ["ANTHROPIC_API_KEY"] = ""       # ensure no real API calls
os.environ["JWT_SECRET"] = "test-secret-that-is-long-enough-for-hs256-ok!"
os.environ["AUTO_CREATE_TABLES"] = "true"

import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.core.db import AsyncSessionLocal, Base, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.services import ai_categorizer  # noqa: E402
from app.services.categories import seed_default_categories  # noqa: E402


@pytest_asyncio.fixture
async def client(monkeypatch):
    # Fresh schema per test.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    # Seed categories (lifespan doesn't run under ASGITransport).
    async with AsyncSessionLocal() as db:
        await seed_default_categories(db)

    # Deterministic AI: "Food" whenever it's an allowed choice, otherwise undecided.
    async def fake_suggest(*, description, amount, txn_type, allowed):
        return ("Food", 0.9) if "Food" in allowed else None

    monkeypatch.setattr(ai_categorizer, "suggest_category", fake_suggest)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    await engine.dispose()


async def register(client: AsyncClient, email: str = "ada@example.com", name: str = "Ada") -> dict:
    """Register a user and return auth headers."""
    resp = await client.post(
        "/auth/register", json={"email": email, "password": "secret1", "name": name}
    )
    assert resp.status_code == 201, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest_asyncio.fixture
async def auth(client):
    return await register(client)
