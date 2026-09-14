from __future__ import annotations

import enum
from decimal import Decimal

from sqlalchemy import Boolean, Enum, ForeignKey, Numeric, String, false
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import CreatedAtMixin


class AccountType(str, enum.Enum):
    cash = "cash"
    bank = "bank"
    credit = "credit"
    mobile = "mobile"   # bKash / Nagad / Rocket etc.
    savings = "savings"


class Account(CreatedAtMixin, Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    type: Mapped[AccountType] = mapped_column(
        Enum(AccountType), default=AccountType.cash, nullable=False
    )
    # Running balance, maintained by the transactions service (never edited directly).
    balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0"), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="BDT", nullable=False)
    # Soft delete: closed accounts keep their history but accept no new transactions.
    is_archived: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="accounts")
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="account",
        cascade="all, delete-orphan",
    )
