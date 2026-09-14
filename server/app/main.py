"""FastAPI application entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import models so their tables register on Base.metadata before create_all.
from app import models  # noqa: F401
from app.api.errors import register_exception_handlers
from app.api.router import api_router
from app.core.config import settings
from app.core.db import AsyncSessionLocal, Base, engine
from app.services.categories import seed_default_categories

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.uses_dev_jwt_secret:
        log = logger.error if settings.APP_ENV == "production" else logger.warning
        log("JWT_SECRET is the built-in dev default — set a real secret in .env.")

    if settings.AUTO_CREATE_TABLES:
        # Dev convenience so first run works before `alembic upgrade head`.
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as db:
        await seed_default_categories(db)
    yield
    await engine.dispose()


app = FastAPI(title="FinanceAI Pro API", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)
app.include_router(api_router)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
