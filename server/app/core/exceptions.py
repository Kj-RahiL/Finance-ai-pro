"""Domain exceptions raised by the service layer.

Services never import FastAPI; `app.api.errors` maps these to HTTP responses so
the same business rules can be reused from background jobs, CLIs, or tests.
"""
from __future__ import annotations


class DomainError(Exception):
    status_code = 400

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class NotFoundError(DomainError):
    status_code = 404


class ConflictError(DomainError):
    status_code = 409


class BusinessRuleError(DomainError):
    """A well-formed request that violates a business rule (e.g. wrong category type)."""

    status_code = 400
