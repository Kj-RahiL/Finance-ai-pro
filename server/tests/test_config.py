"""Settings normalization."""
import pytest

from app.core.config import Settings


@pytest.mark.parametrize(
    "given, expected",
    [
        ("postgres://u:p@host/db", "postgresql+asyncpg://u:p@host/db"),          # Render / Heroku style
        ("postgresql://u:p@host/db", "postgresql+asyncpg://u:p@host/db"),        # Neon / Supabase style
        ("postgresql+asyncpg://u:p@host/db", "postgresql+asyncpg://u:p@host/db"),  # already correct
        ("sqlite+aiosqlite:///./x.db", "sqlite+aiosqlite:///./x.db"),
        # Neon pastes libpq params that asyncpg rejects: translate sslmode, drop channel_binding.
        (
            "postgresql://u:p@ep-x.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
            "postgresql+asyncpg://u:p@ep-x.aws.neon.tech/neondb?ssl=require",
        ),
        ("postgres://u:p@host/db?sslmode=require", "postgresql+asyncpg://u:p@host/db?ssl=require"),
    ],
)
def test_database_url_is_normalized_to_async_driver(given, expected):
    assert Settings(DATABASE_URL=given, _env_file=None).DATABASE_URL == expected
