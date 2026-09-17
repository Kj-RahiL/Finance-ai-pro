"""Transaction service: CRUD with running-balance bookkeeping, filtering, and summaries.

Balance rule: every transaction contributes a signed amount to its account
(+ for income, - for expense). Create applies it, delete reverses it, and
update reverses the old effect before applying the new one — so the account
balance is always the sum of its transactions plus the opening balance.
"""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.account import Account
from app.models.transaction import Transaction, TransactionType
from app.models.category import Category
from app.schemas.dashboard import CategoryBreakdown, CategorySpend, MonthlySummary
from app.schemas.transaction import TransactionCreate, TransactionFilters, TransactionUpdate
from app.services import accounts as account_service
from app.services import categories as category_service


def signed_amount(txn_type: TransactionType, amount: Decimal) -> Decimal:
    return amount if txn_type is TransactionType.income else -amount


def _owned(user_id: int) -> Select[tuple[Transaction]]:
    return (
        select(Transaction)
        .join(Account, Transaction.account_id == Account.id)
        .where(Account.user_id == user_id)
    )


async def get_owned_transaction(db: AsyncSession, user_id: int, txn_id: int) -> Transaction:
    txn = await db.scalar(_owned(user_id).where(Transaction.id == txn_id))
    if txn is None:
        raise NotFoundError("Transaction not found")
    return txn


async def create_transaction(
    db: AsyncSession, user_id: int, data: TransactionCreate
) -> Transaction:
    if data.account_id is not None:
        account = await account_service.get_owned_account(db, user_id, data.account_id)
    else:
        account = await account_service.get_default_account(db, user_id)
    account_service.ensure_active(account)

    category, ai_suggested = await category_service.resolve_category(
        db,
        txn_type=data.type,
        description=data.description,
        amount=data.amount,
        category_id=data.category_id,
    )

    txn = Transaction(
        account_id=account.id,
        category=category,  # sets relationship + category_id; avoids a lazy reload
        amount=data.amount,
        type=data.type,
        description=data.description,
        date=data.date or date.today(),
        ai_suggested=ai_suggested,
    )
    account.balance = account.balance + signed_amount(data.type, data.amount)
    db.add(txn)
    await db.commit()
    return txn


async def update_transaction(
    db: AsyncSession, user_id: int, txn_id: int, data: TransactionUpdate
) -> Transaction:
    txn = await get_owned_transaction(db, user_id, txn_id)
    changes = data.model_dump(exclude_unset=True, exclude_none=True)

    # Reverse the old balance effect before anything changes.
    old_account = await db.get(Account, txn.account_id)
    assert old_account is not None
    old_account.balance = old_account.balance - signed_amount(txn.type, txn.amount)

    account = old_account
    if "account_id" in changes and changes["account_id"] != txn.account_id:
        account = await account_service.get_owned_account(db, user_id, changes["account_id"])
        account_service.ensure_active(account)
        txn.account_id = account.id

    for field in ("amount", "description", "type", "date"):
        if field in changes:
            setattr(txn, field, changes[field])

    if "category_id" in changes:
        # A user-chosen category overrides the AI — that's the correction path.
        txn.category = await category_service.get_category_for_type(
            db, changes["category_id"], txn.type
        )
        txn.ai_suggested = False
    elif txn.category is None or txn.category.type.value != txn.type.value:
        # Type flipped (or no category yet): the old category no longer fits.
        txn.category, txn.ai_suggested = await category_service.resolve_category(
            db, txn_type=txn.type, description=txn.description, amount=txn.amount
        )

    account.balance = account.balance + signed_amount(txn.type, txn.amount)
    await db.commit()
    return txn


async def delete_transaction(db: AsyncSession, user_id: int, txn_id: int) -> None:
    txn = await get_owned_transaction(db, user_id, txn_id)
    account = await db.get(Account, txn.account_id)
    assert account is not None
    account.balance = account.balance - signed_amount(txn.type, txn.amount)
    await db.delete(txn)
    await db.commit()


def _apply_filters(stmt: Select, f: TransactionFilters) -> Select:
    if f.account_id is not None:
        stmt = stmt.where(Transaction.account_id == f.account_id)
    if f.category_id is not None:
        stmt = stmt.where(Transaction.category_id == f.category_id)
    if f.type is not None:
        stmt = stmt.where(Transaction.type == f.type)
    if f.date_from is not None:
        stmt = stmt.where(Transaction.date >= f.date_from)
    if f.date_to is not None:
        stmt = stmt.where(Transaction.date <= f.date_to)
    if f.q:
        stmt = stmt.where(Transaction.description.ilike(f"%{f.q.strip()}%"))
    return stmt


async def list_transactions(
    db: AsyncSession, user_id: int, filters: TransactionFilters
) -> tuple[list[Transaction], int]:
    """Newest first (by transaction date, then insertion). Returns (page, total)."""
    base = _apply_filters(_owned(user_id), filters)

    total = await db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = await db.scalars(
        base.order_by(Transaction.date.desc(), Transaction.created_at.desc(), Transaction.id.desc())
        .limit(filters.limit)
        .offset(filters.offset)
    )
    return list(rows), total


def _month_bounds(year: int, month: int) -> tuple[date, date]:
    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    return start, end


async def monthly_summary(
    db: AsyncSession, user_id: int, *, year: int, month: int
) -> MonthlySummary:
    start, end = _month_bounds(year, month)
    in_month = (
        select(Transaction.type, func.count(Transaction.id), func.sum(Transaction.amount))
        .join(Account, Transaction.account_id == Account.id)
        .where(Account.user_id == user_id, Transaction.date >= start, Transaction.date < end)
        .group_by(Transaction.type)
    )
    totals: dict[TransactionType, Decimal] = {}
    count = 0
    for txn_type, n, total in await db.execute(in_month):
        totals[txn_type] = Decimal(str(total or 0))
        count += n

    total_balance = await db.scalar(
        select(func.coalesce(func.sum(Account.balance), 0)).where(
            Account.user_id == user_id, Account.is_archived.is_(False)
        )
    )

    income = totals.get(TransactionType.income, Decimal("0"))
    expense = totals.get(TransactionType.expense, Decimal("0"))
    return MonthlySummary(
        year=year,
        month=month,
        income=float(income),
        expense=float(expense),
        net=float(income - expense),
        transaction_count=count,
        total_balance=float(Decimal(str(total_balance or 0))),
    )


async def spending_by_category(
    db: AsyncSession, user_id: int, *, year: int, month: int
) -> CategoryBreakdown:
    """Expense totals per category for a month, largest first."""
    start, end = _month_bounds(year, month)
    stmt = (
        select(
            Transaction.category_id,
            Category.name,
            Category.icon,
            func.count(Transaction.id),
            func.sum(Transaction.amount),
        )
        .join(Account, Transaction.account_id == Account.id)
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(
            Account.user_id == user_id,
            Transaction.type == TransactionType.expense,
            Transaction.date >= start,
            Transaction.date < end,
        )
        .group_by(Transaction.category_id, Category.name, Category.icon)
        .order_by(func.sum(Transaction.amount).desc())
    )
    rows = [
        (cid, name or "Uncategorized", icon or "❓", n, Decimal(str(total or 0)))
        for cid, name, icon, n, total in await db.execute(stmt)
    ]
    total_expense = sum((r[4] for r in rows), Decimal("0"))
    return CategoryBreakdown(
        year=year,
        month=month,
        total_expense=float(total_expense),
        items=[
            CategorySpend(
                category_id=cid,
                name=name,
                icon=icon,
                total=float(total),
                count=n,
                share=float(total / total_expense) if total_expense else 0.0,
            )
            for cid, name, icon, n, total in rows
        ],
    )
