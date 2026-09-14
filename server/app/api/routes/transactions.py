"""Transaction routes — CRUD with AI categorization and running balances."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query, Response, status

from app.api.deps import CurrentUser, DbSession
from app.models.transaction import Transaction
from app.schemas.transaction import (
    TransactionCreate,
    TransactionFilters,
    TransactionOut,
    TransactionPage,
    TransactionUpdate,
)
from app.services import transactions as transaction_service

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=TransactionPage)
async def list_transactions(
    filters: Annotated[TransactionFilters, Query()],
    current_user: CurrentUser,
    db: DbSession,
) -> TransactionPage:
    items, total = await transaction_service.list_transactions(db, current_user.id, filters)
    return TransactionPage(
        items=[TransactionOut.model_validate(t) for t in items],
        total=total,
        limit=filters.limit,
        offset=filters.offset,
    )


@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    payload: TransactionCreate, current_user: CurrentUser, db: DbSession
) -> Transaction:
    return await transaction_service.create_transaction(db, current_user.id, payload)


@router.get("/{txn_id}", response_model=TransactionOut)
async def get_transaction(txn_id: int, current_user: CurrentUser, db: DbSession) -> Transaction:
    return await transaction_service.get_owned_transaction(db, current_user.id, txn_id)


@router.patch("/{txn_id}", response_model=TransactionOut)
async def update_transaction(
    txn_id: int, payload: TransactionUpdate, current_user: CurrentUser, db: DbSession
) -> Transaction:
    return await transaction_service.update_transaction(db, current_user.id, txn_id, payload)


@router.delete("/{txn_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(txn_id: int, current_user: CurrentUser, db: DbSession) -> Response:
    await transaction_service.delete_transaction(db, current_user.id, txn_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
