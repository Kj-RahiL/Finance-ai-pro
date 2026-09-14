"""Async SQLAlchemy engine, session factory, and declarative base."""
from __future__ import annotations

import warnings
from collections.abc import AsyncGenerator

from sqlalchemy.exc import SAWarning
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    """Declarative base shared by all ORM models."""


if settings.is_sqlite:
    # SQLite has no native DECIMAL; SQLAlchemy round-trips Numeric through float
    # and warns about it. Postgres is the real target — keep dev logs quiet.
    warnings.filterwarnings("ignore", message=".*does \\*not\\* support Decimal.*", category=SAWarning)

engine = create_async_engine(settings.DATABASE_URL, echo=False)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding a scoped async session."""
    async with AsyncSessionLocal() as session:
        yield session
