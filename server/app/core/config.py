"""Application configuration, loaded from environment / .env via pydantic-settings."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database — defaults to a local SQLite file so the app runs with zero setup.
    # .env.example points this at Postgres (the intended dev target).
    DATABASE_URL: str = "sqlite+aiosqlite:///./financeai.db"
    # Create tables on startup (dev convenience). Disable to rely on Alembic only.
    AUTO_CREATE_TABLES: bool = True

    # Auth. Override in .env for production — this dev default is intentionally
    # long enough (>=32 bytes) to satisfy HS256 without noisy warnings.
    JWT_SECRET: str = "dev-only-insecure-secret-change-me-in-production-32b+"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Anthropic / Claude
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-opus-5"

    # CORS — comma-separated origins
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
