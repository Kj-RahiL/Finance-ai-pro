"""Category routes."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.models.category import Category
from app.schemas.category import CategoryOut
from app.services import categories as category_service

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
async def list_categories(_current_user: CurrentUser, db: DbSession) -> list[Category]:
    return await category_service.list_categories(db)
