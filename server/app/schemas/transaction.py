from __future__ import annotations

from datetime import date as date_type
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.transaction import TransactionType
from app.schemas.category import CategoryOut

_AMOUNT = Field(gt=0, max_digits=14, decimal_places=2, description="Positive amount in the account's currency.")


class TransactionCreate(BaseModel):
    amount: Decimal = _AMOUNT
    description: str = Field(min_length=1, max_length=255)
    type: TransactionType = TransactionType.expense
    date: date_type | None = Field(default=None, description="Defaults to today.")
    account_id: int | None = Field(default=None, description="Defaults to the user's first active account.")
    category_id: int | None = Field(
        default=None, description="Explicit category. Omit to let the AI categorize."
    )


class TransactionUpdate(BaseModel):
    """Partial update; only provided fields change. Setting category_id clears ai_suggested."""

    amount: Decimal | None = Field(default=None, gt=0, max_digits=14, decimal_places=2)
    description: str | None = Field(default=None, min_length=1, max_length=255)
    type: TransactionType | None = None
    date: date_type | None = None
    account_id: int | None = None
    category_id: int | None = None


class TransactionFilters(BaseModel):
    """Query parameters for listing transactions."""

    model_config = ConfigDict(extra="forbid")

    account_id: int | None = None
    category_id: int | None = None
    type: TransactionType | None = None
    date_from: date_type | None = None
    date_to: date_type | None = None
    q: str | None = Field(default=None, max_length=100, description="Case-insensitive description search.")
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    account_id: int
    amount: float
    description: str
    type: TransactionType
    date: date_type
    ai_suggested: bool
    created_at: datetime
    updated_at: datetime
    category: CategoryOut | None = None


class TransactionPage(BaseModel):
    items: list[TransactionOut]
    total: int
    limit: int
    offset: int
