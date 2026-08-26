from __future__ import annotations

import enum

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class CategoryType(str, enum.Enum):
    income = "income"
    expense = "expense"


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)
    type: Mapped[CategoryType] = mapped_column(
        Enum(CategoryType), default=CategoryType.expense, nullable=False
    )
    icon: Mapped[str] = mapped_column(String(16), default="💰", nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
