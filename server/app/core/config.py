"""Application configuration, loaded from environment / .env via pydantic-settings."""
from __future__ import annotations

from functools import lru_cache
from typing import Literal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Dev-only default; startup logs a warning whenever it is still in use.
_DEV_JWT_SECRET = "dev-only-insecure-secret-change-me-in-production-32b+"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_ENV: Literal["development", "production"] = "development"

    # Database — defaults to a local SQLite file so the app runs with zero setup.
    # .env.example points this at Postgres (the intended dev target).
    DATABASE_URL: str = "sqlite+aiosqlite:///./financeai.db"
    # Create tables on startup (dev convenience). Disable to rely on Alembic only.
    AUTO_CREATE_TABLES: bool = True

    # Auth. Override in .env for production — the dev default is intentionally
    # long enough (>=32 bytes) to satisfy HS256 without noisy warnings.
    JWT_SECRET: str = _DEV_JWT_SECRET
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Anthropic / Claude
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-opus-5"

    # Money
    DEFAULT_CURRENCY: str = "BDT"

    # CORS — comma-separated origins
    CORS_ORIGINS: str = "http://localhost:3000"

    @field_validator("DATABASE_URL")
    @classmethod
    def _normalize_postgres_url(cls, url: str) -> str:
        """Make a hosted-Postgres URL (Render, Neon, Supabase, Heroku) usable as-is.

        - `postgres://` / `postgresql://` → `postgresql+asyncpg://` (async driver)
        - libpq-only query params: `sslmode=…` → `ssl=…`; `channel_binding` dropped
          (asyncpg rejects them as unknown connect() kwargs)
        """
        for prefix in ("postgres://", "postgresql://"):
            if url.startswith(prefix):
                url = "postgresql+asyncpg://" + url[len(prefix):]
        if not url.startswith("postgresql+asyncpg://") or "?" not in url:
            return url

        parts = urlsplit(url)
        query = []
        for key, value in parse_qsl(parts.query, keep_blank_values=True):
            if key == "sslmode":
                query.append(("ssl", value))
            elif key != "channel_binding":
                query.append((key, value))
        return urlunsplit(parts._replace(query=urlencode(query)))

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def uses_dev_jwt_secret(self) -> bool:
        return self.JWT_SECRET == _DEV_JWT_SECRET


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
