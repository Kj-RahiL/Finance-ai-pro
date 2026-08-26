from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.transaction import TransactionType
from app.schemas.category import CategoryOut


class TransactionCreate(BaseModel):
    amount: float = Field(gt=0, description="Positive amount in account currency (BDT).")
    description: str = Field(min_length=1, max_length=255)
    type: TransactionType = TransactionType.expense


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: float
    description: str
    type: TransactionType
    date: date
    ai_suggested: bool
    created_at: datetime
    category: CategoryOut | None = None
