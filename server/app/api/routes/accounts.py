"""Account routes."""
from __future__ import annotations

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DbSession
from app.models.account import Account
from app.schemas.account import AccountCreate, AccountOut, AccountUpdate
from app.services import accounts as account_service

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=list[AccountOut])
async def list_accounts(
    current_user: CurrentUser,
    db: DbSession,
    include_archived: bool = Query(default=False),
) -> list[Account]:
    return await account_service.list_accounts(
        db, current_user.id, include_archived=include_archived
    )


@router.post("", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
async def create_account(payload: AccountCreate, current_user: CurrentUser, db: DbSession) -> Account:
    return await account_service.create_account(db, current_user.id, payload)


@router.get("/{account_id}", response_model=AccountOut)
async def get_account(account_id: int, current_user: CurrentUser, db: DbSession) -> Account:
    return await account_service.get_owned_account(db, current_user.id, account_id)


@router.patch("/{account_id}", response_model=AccountOut)
async def update_account(
    account_id: int, payload: AccountUpdate, current_user: CurrentUser, db: DbSession
) -> Account:
    return await account_service.update_account(db, current_user.id, account_id, payload)


@router.delete("/{account_id}", response_model=AccountOut)
async def archive_account(account_id: int, current_user: CurrentUser, db: DbSession) -> Account:
    """Soft delete — the account is archived, its transactions are kept."""
    return await account_service.archive_account(db, current_user.id, account_id)
