"""Category routes."""
from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.category import Category
from app.schemas.category import CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
async def list_categories(current_user: CurrentUser, db: DbSession) -> list[Category]:
    rows = await db.scalars(select(Category).order_by(Category.id))
    return list(rows)
