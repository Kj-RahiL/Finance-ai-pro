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
