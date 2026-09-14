"""Category service: default set, seeding, and category resolution for transactions."""
from __future__ import annotations

import logging
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.models.category import Category, CategoryType
from app.models.transaction import TransactionType
from app.services import ai_categorizer

logger = logging.getLogger(__name__)

# (name, type, icon) — the single source of truth for the seeded category set.
DEFAULT_CATEGORIES: list[tuple[str, CategoryType, str]] = [
    ("Food", CategoryType.expense, "🍔"),
    ("Transport", CategoryType.expense, "🚗"),
    ("Shopping", CategoryType.expense, "🛍️"),
    ("Bills", CategoryType.expense, "🧾"),
    ("Entertainment", CategoryType.expense, "🎬"),
    ("Health", CategoryType.expense, "💊"),
    ("Income", CategoryType.income, "💵"),
    ("Other", CategoryType.expense, "❓"),
]

# Where a transaction lands when the AI is unavailable or undecided.
FALLBACK_CATEGORY: dict[CategoryType, str] = {
    CategoryType.expense: "Other",
    CategoryType.income: "Income",
}


async def seed_default_categories(db: AsyncSession) -> int:
    """Insert any missing default categories. Idempotent; returns how many were added."""
    existing = set(await db.scalars(select(Category.name)))
    added = 0
    for name, ctype, icon in DEFAULT_CATEGORIES:
        if name in existing:
            continue
        db.add(Category(name=name, type=ctype, icon=icon, is_default=True))
        added += 1
    if added:
        await db.commit()
        logger.info("Seeded %d default categories.", added)
    return added


async def list_categories(db: AsyncSession) -> list[Category]:
    return list(await db.scalars(select(Category).order_by(Category.id)))


async def get_category(db: AsyncSession, category_id: int) -> Category:
    category = await db.get(Category, category_id)
    if category is None:
        raise NotFoundError("Category not found")
    return category


def _category_type_for(txn_type: TransactionType) -> CategoryType:
    return CategoryType(txn_type.value)


async def get_category_for_type(
    db: AsyncSession, category_id: int, txn_type: TransactionType
) -> Category:
    """Fetch a user-chosen category and make sure it matches the transaction type."""
    category = await get_category(db, category_id)
    if category.type is not _category_type_for(txn_type):
        raise BusinessRuleError(
            f"Category '{category.name}' is an {category.type.value} category "
            f"and cannot be used on an {txn_type.value} transaction"
        )
    return category


async def resolve_category(
    db: AsyncSession,
    *,
    txn_type: TransactionType,
    description: str,
    amount: Decimal,
    category_id: int | None = None,
) -> tuple[Category, bool]:
    """Pick the category for a transaction.

    Returns (category, ai_suggested). An explicit `category_id` always wins
    (ai_suggested=False). Otherwise the AI chooses from the categories that
    match the transaction type; on failure or when there's only one candidate
    we use the type's fallback category.
    """
    if category_id is not None:
        return await get_category_for_type(db, category_id, txn_type), False

    ctype = _category_type_for(txn_type)
    candidates = list(
        await db.scalars(select(Category).where(Category.type == ctype).order_by(Category.id))
    )
    by_name = {c.name: c for c in candidates}

    fallback = by_name.get(FALLBACK_CATEGORY[ctype])
    if fallback is None:  # seed missing — degrade to any category of the right type
        fallback = candidates[0] if candidates else None
    if fallback is None:
        raise BusinessRuleError(f"No {ctype.value} categories exist; seed the database first")

    if len(candidates) < 2:
        return fallback, False

    suggestion = await ai_categorizer.suggest_category(
        description=description,
        amount=amount,
        txn_type=txn_type.value,
        allowed=tuple(by_name),
    )
    if suggestion is None:
        return fallback, False

    name, confidence = suggestion
    logger.info("AI categorized %r as %s (confidence=%.2f).", description, name, confidence)
    return by_name[name], True
