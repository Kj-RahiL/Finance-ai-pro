from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.account import AccountType

# ISO-4217 code, e.g. BDT / USD.
_CURRENCY = Field(default="BDT", pattern=r"^[A-Z]{3}$")


class AccountCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    type: AccountType = AccountType.cash
    currency: str = _CURRENCY
    # Opening balance; afterwards the balance only moves via transactions.
    balance: Decimal = Field(default=Decimal("0"), max_digits=14, decimal_places=2)


class AccountUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    type: AccountType | None = None
    currency: str | None = Field(default=None, pattern=r"^[A-Z]{3}$")
    is_archived: bool | None = None


class AccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: AccountType
    balance: float
    currency: str
    is_archived: bool
    created_at: datetime
