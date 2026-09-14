"""Auth routes: register, login, current user."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.services import users as user_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _token_response(user: User) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: DbSession) -> TokenResponse:
    user = await user_service.register_user(
        db, email=payload.email, password=payload.password, name=payload.name
    )
    return _token_response(user)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: DbSession) -> TokenResponse:
    user = await user_service.authenticate_user(db, email=payload.email, password=payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
    return _token_response(user)


@router.get("/me", response_model=UserOut)
async def me(current_user: CurrentUser) -> User:
    return current_user
