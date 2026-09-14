"""Aggregate API router — add new feature routers here."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import accounts, auth, categories, dashboard, transactions

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(accounts.router)
api_router.include_router(categories.router)
api_router.include_router(transactions.router)
api_router.include_router(dashboard.router)
