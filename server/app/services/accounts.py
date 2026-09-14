"""Account service: CRUD with ownership checks and soft-archive."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import BusinessRuleError, NotFoundError
from app.models.account import Account, AccountType
from app.schemas.account import AccountCreate, AccountUpdate


async def list_accounts(
    db: AsyncSession, user_id: int, *, include_archived: bool = False
) -> list[Account]:
    stmt = select(Account).where(Account.user_id == user_id).order_by(Account.id)
    if not include_archived:
        stmt = stmt.where(Account.is_archived.is_(False))
    return list(await db.scalars(stmt))


async def get_owned_account(db: AsyncSession, user_id: int, account_id: int) -> Account:
    """Fetch an account the user owns; 404 otherwise (never leak other users' ids)."""
    account = await db.scalar(
        select(Account).where(Account.id == account_id, Account.user_id == user_id)
    )
    if account is None:
        raise NotFoundError("Account not found")
    return account


async def get_default_account(db: AsyncSession, user_id: int) -> Account:
    """The user's first active account; created on the fly if none exists."""
    account = await db.scalar(
        select(Account)
        .where(Account.user_id == user_id, Account.is_archived.is_(False))
        .order_by(Account.id)
    )
    if account is None:
        account = Account(
            user_id=user_id,
            name="Cash",
            type=AccountType.cash,
            currency=settings.DEFAULT_CURRENCY,
        )
        db.add(account)
        await db.flush()
    return account


def ensure_active(account: Account) -> None:
    if account.is_archived:
        raise BusinessRuleError(f"Account '{account.name}' is archived")


async def create_account(db: AsyncSession, user_id: int, data: AccountCreate) -> Account:
    account = Account(
        user_id=user_id,
        name=data.name,
        type=data.type,
        currency=data.currency,
        balance=data.balance,
    )
    db.add(account)
    await db.commit()
    return account


async def update_account(
    db: AsyncSession, user_id: int, account_id: int, data: AccountUpdate
) -> Account:
    account = await get_owned_account(db, user_id, account_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(account, field, value)
    await db.commit()
    return account


async def archive_account(db: AsyncSession, user_id: int, account_id: int) -> Account:
    """Soft delete: history is kept, the account stops accepting transactions."""
    account = await get_owned_account(db, user_id, account_id)
    account.is_archived = True
    await db.commit()
    return account
