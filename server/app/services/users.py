"""User service: registration and credential checks."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ConflictError
from app.core.security import hash_password, verify_password
from app.models.account import Account, AccountType
from app.models.user import User


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    return await db.scalar(select(User).where(User.email == email.lower()))


async def register_user(db: AsyncSession, *, email: str, password: str, name: str) -> User:
    email = email.lower()
    if await get_user_by_email(db, email) is not None:
        raise ConflictError("Email already registered")

    user = User(email=email, password_hash=hash_password(password), name=name)
    db.add(user)
    await db.flush()  # assign user.id

    # Every user starts with a default Cash account so the first transaction just works.
    db.add(
        Account(
            user_id=user.id,
            name="Cash",
            type=AccountType.cash,
            currency=settings.DEFAULT_CURRENCY,
        )
    )
    await db.commit()
    return user


async def authenticate_user(db: AsyncSession, *, email: str, password: str) -> User | None:
    user = await get_user_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user
