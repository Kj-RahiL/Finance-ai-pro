"""The AI categorizer must degrade gracefully and only ever answer within the allowed set."""
from decimal import Decimal
from typing import Literal

import anthropic
import pytest

from app.services import ai_categorizer
from app.services.ai_categorizer import _suggestion_model, suggest_category

ALLOWED = ("Food", "Transport", "Other")


def test_suggestion_model_is_constrained_to_allowed_set():
    model = _suggestion_model(ALLOWED)
    assert model(category="Food", confidence=0.5).category == "Food"
    with pytest.raises(ValueError):
        model(category="Rent", confidence=0.5)
    with pytest.raises(ValueError):
        model(category="Food", confidence=1.5)
    # Same allowed tuple → same cached model (keeps schema generation off the hot path).
    assert _suggestion_model(ALLOWED) is model
    assert _suggestion_model(("Food",)).model_fields["category"].annotation == Literal["Food"]


async def test_no_api_key_returns_none(monkeypatch):
    monkeypatch.setattr(ai_categorizer.settings, "ANTHROPIC_API_KEY", "")
    assert await suggest_category(
        description="KFC", amount=Decimal("550"), txn_type="expense", allowed=ALLOWED
    ) is None


class _FailingMessages:
    def __init__(self, exc: Exception):
        self.exc = exc

    async def parse(self, **_kwargs):
        raise self.exc


class _FakeClient:
    def __init__(self, exc: Exception):
        self.messages = _FailingMessages(exc)


@pytest.mark.parametrize(
    "exc",
    [
        anthropic.APIConnectionError(request=None),  # type: ignore[arg-type]
        RuntimeError("boom"),
    ],
)
async def test_api_failures_degrade_to_none(monkeypatch, exc):
    monkeypatch.setattr(ai_categorizer.settings, "ANTHROPIC_API_KEY", "sk-test")
    monkeypatch.setattr(ai_categorizer, "_get_client", lambda: _FakeClient(exc))
    assert await suggest_category(
        description="KFC", amount=Decimal("550"), txn_type="expense", allowed=ALLOWED
    ) is None
