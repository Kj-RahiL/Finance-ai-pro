"""AI transaction categorization via the Claude API.

Design goals:
- Constrain Claude's answer to the seeded category set so it maps 1:1 to a row.
- Never break the request path: any missing key / API error / bad output
  degrades gracefully to the "Other" category with ai_suggested=False.
"""
from __future__ import annotations

import json
import logging
from typing import Literal

from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger(__name__)

# (name, type, icon) — the single source of truth for seeding + the AI's choices.
DEFAULT_CATEGORIES: list[tuple[str, str, str]] = [
    ("Food", "expense", "🍔"),
    ("Transport", "expense", "🚗"),
    ("Shopping", "expense", "🛍️"),
    ("Bills", "expense", "🧾"),
    ("Entertainment", "expense", "🎬"),
    ("Health", "expense", "💊"),
    ("Income", "income", "💵"),
    ("Other", "expense", "❓"),
]
CATEGORY_NAMES: list[str] = [name for name, _type, _icon in DEFAULT_CATEGORIES]
FALLBACK_CATEGORY = "Other"

# Literal type mirrors CATEGORY_NAMES so Claude can only pick a valid category.
CategoryName = Literal[
    "Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Income", "Other"
]


class CategorySuggestion(BaseModel):
    category: CategoryName = Field(description="Best-fit category for the transaction.")
    confidence: float = Field(ge=0, le=1, description="0–1 confidence in the choice.")


_SYSTEM_PROMPT = (
    "You categorize personal-finance transactions for a Bangladeshi budgeting app. "
    "Given a short description and amount, pick exactly one category from the allowed "
    "set. Amounts are in BDT (Bangladeshi Taka). Common local context: 'bKash'/'Nagad'/"
    "'Rocket' are mobile wallets; 'CNG'/'rickshaw'/'Uber'/'Pathao' are transport; "
    "'bazar'/restaurant names are Food. Be decisive; use 'Other' only when nothing fits."
)

# Lazily-constructed async client so importing this module never requires a key.
_client = None


def _get_client():
    global _client
    if _client is None:
        from anthropic import AsyncAnthropic

        _client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


def _json_schema() -> dict:
    return {
        "type": "object",
        "properties": {
            "category": {"type": "string", "enum": CATEGORY_NAMES},
            "confidence": {"type": "number"},
        },
        "required": ["category", "confidence"],
        "additionalProperties": False,
    }


async def _ask_claude(user_prompt: str) -> tuple[str, float]:
    """Call Claude and return (category, confidence). Raises on failure."""
    client = _get_client()

    # Preferred path: typed structured output via messages.parse().
    parse = getattr(client.messages, "parse", None)
    if parse is not None:
        response = await client.messages.parse(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=256,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
            output_format=CategorySuggestion,
        )
        parsed = response.parsed_output
        if parsed is not None:
            return parsed.category, parsed.confidence

    # Fallback: raw json_schema output for SDKs without .parse().
    response = await client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=256,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
        output_config={"format": {"type": "json_schema", "schema": _json_schema()}},
    )
    text = next(block.text for block in response.content if block.type == "text")
    data = json.loads(text)
    return data["category"], float(data.get("confidence", 0.0))


async def categorize_transaction(
    description: str, amount: float, txn_type: str
) -> tuple[str, bool]:
    """Return (category_name, ai_suggested).

    ai_suggested is True only when Claude produced a valid categorization.
    On any failure we fall back to ("Other", False) — the caller never sees an error.
    """
    if not settings.ANTHROPIC_API_KEY:
        logger.info("ANTHROPIC_API_KEY not set — skipping AI categorization.")
        return FALLBACK_CATEGORY, False

    user_prompt = (
        f'Transaction description: "{description}"\n'
        f"Amount: {amount} BDT\n"
        f"Type: {txn_type}\n"
        "Categorize this transaction."
    )

    try:
        category, confidence = await _ask_claude(user_prompt)
    except Exception as exc:  # noqa: BLE001 — degrade gracefully on any AI failure
        logger.warning("AI categorization failed (%s); using fallback.", exc)
        return FALLBACK_CATEGORY, False

    if category not in CATEGORY_NAMES:
        logger.warning("AI returned unknown category %r; using fallback.", category)
        return FALLBACK_CATEGORY, False

    logger.info("AI categorized %r as %s (confidence=%.2f).", description, category, confidence)
    return category, True
