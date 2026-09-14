"""Dashboard routes — read-only aggregates."""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.schemas.dashboard import MonthlySummary
from app.services import transactions as transaction_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=MonthlySummary)
async def monthly_summary(
    current_user: CurrentUser,
    db: DbSession,
    year: int | None = Query(default=None, ge=2000, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
) -> MonthlySummary:
    """Income / expense / net for a month (default: current) plus total active balance."""
    today = date.today()
    return await transaction_service.monthly_summary(
        db, current_user.id, year=year or today.year, month=month or today.month
    )
