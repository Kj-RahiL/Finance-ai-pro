from __future__ import annotations

import enum
from datetime import date as date_type
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import CreatedAtMixin, utcnow


class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"


class Transaction(CreatedAtMixin, Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    account_id: Mapped[int] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), index=True, nullable=False
    )
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id"), nullable=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType), default=TransactionType.expense, nullable=False
    )
    description: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    date: Mapped[date_type] = mapped_column(
        Date, default=date_type.today, index=True, nullable=False
    )
    # True when the category was assigned by the AI categorizer (vs. user-chosen / fallback).
    ai_suggested: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    account: Mapped["Account"] = relationship(back_populates="transactions")
    category: Mapped["Category | None"] = relationship(lazy="selectin")
