"""Transaction routes — list and create (with AI categorization)."""
from __future__ import annotations

from fastapi import APIRouter, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionOut
from app.services.ai_categorizer import FALLBACK_CATEGORY, categorize_transaction

router = APIRouter(prefix="/transactions", tags=["transactions"])


async def _default_account(db: DbSession, user_id: int) -> Account:
    account = await db.scalar(
        select(Account).where(Account.user_id == user_id).order_by(Account.id)
    )
    if account is None:
        # Defensive: create one if somehow missing (older users, etc.).
        account = Account(user_id=user_id, name="Cash")
        db.add(account)
        await db.flush()
    return account


@router.get("", response_model=list[TransactionOut])
async def list_transactions(current_user: CurrentUser, db: DbSession) -> list[Transaction]:
    stmt = (
        select(Transaction)
        .join(Account, Transaction.account_id == Account.id)
        .where(Account.user_id == current_user.id)
        .order_by(Transaction.created_at.desc(), Transaction.id.desc())
    )
    rows = await db.scalars(stmt)
    return list(rows)


@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    payload: TransactionCreate, current_user: CurrentUser, db: DbSession
) -> Transaction:
    account = await _default_account(db, current_user.id)

    category_name, ai_suggested = await categorize_transaction(
        payload.description, payload.amount, payload.type.value
    )

    category = await db.scalar(select(Category).where(Category.name == category_name))
    if category is None:  # fallback category should always exist post-seed
        category = await db.scalar(select(Category).where(Category.name == FALLBACK_CATEGORY))

    transaction = Transaction(
        account_id=account.id,
        category=category,  # sets relationship + category_id; avoids a lazy reload
        amount=payload.amount,
        type=payload.type,
        description=payload.description,
        ai_suggested=ai_suggested,
    )
    db.add(transaction)
    await db.commit()
    return transaction
