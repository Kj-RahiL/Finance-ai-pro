from __future__ import annotations

from pydantic import BaseModel


class MonthlySummary(BaseModel):
    year: int
    month: int
    income: float
    expense: float
    net: float
    transaction_count: int
    # Sum of active account balances. Assumes a single base currency for now.
    total_balance: float


class CategorySpend(BaseModel):
    category_id: int | None
    name: str
    icon: str
    total: float
    count: int
    # Share of the month's expenses, 0–1.
    share: float


class CategoryBreakdown(BaseModel):
    year: int
    month: int
    total_expense: float
    items: list[CategorySpend]
