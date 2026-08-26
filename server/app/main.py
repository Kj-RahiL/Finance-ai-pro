"""FastAPI application entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

# Import models so their tables register on Base.metadata before create_all.
from app import models  # noqa: F401
from app.api.routes import auth, categories, transactions
from app.core.config import settings
from app.core.db import AsyncSessionLocal, Base, engine
from app.models.category import Category, CategoryType
from app.services.ai_categorizer import DEFAULT_CATEGORIES

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def _seed_categories() -> None:
    """Insert the default categories once (idempotent)."""
    async with AsyncSessionLocal() as db:
        if await db.scalar(select(Category.id).limit(1)) is not None:
            return
        for name, ctype, icon in DEFAULT_CATEGORIES:
            db.add(Category(name=name, type=CategoryType(ctype), icon=icon, is_default=True))
        await db.commit()
        logger.info("Seeded %d default categories.", len(DEFAULT_CATEGORIES))


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.AUTO_CREATE_TABLES:
        # Dev convenience so first run works before `alembic upgrade head`.
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    await _seed_categories()
    yield
    await engine.dispose()


app = FastAPI(title="FinanceAI Pro API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(transactions.router)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
