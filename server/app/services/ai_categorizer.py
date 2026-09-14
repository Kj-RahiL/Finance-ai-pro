"""AI transaction categorization via the Claude API.

Design goals:
- Constrain Claude's answer to the caller-supplied category set (structured
  output with a Literal enum) so the result maps 1:1 to a DB row.
- Never break the request path: any missing key / API error / bad output
  degrades to `None`, and the caller applies its own fallback category.
"""
from __future__ import annotations

import logging
from decimal import Decimal
from functools import lru_cache
from typing import Literal

import anthropic
from pydantic import BaseModel, Field, create_model

from app.core.config import settings

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You categorize personal-finance transactions for a Bangladeshi budgeting app. "
    "Given a short description and amount, pick exactly one category from the allowed "
    "set. Amounts are in BDT (Bangladeshi Taka). Common local context: 'bKash'/'Nagad'/"
    "'Rocket' are mobile wallets; 'CNG'/'rickshaw'/'Uber'/'Pathao' are transport; "
    "'bazar'/restaurant names are Food. Be decisive; use 'Other' only when nothing fits."
)

# Lazily-constructed client so importing this module never requires a key.
_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


@lru_cache(maxsize=32)
def _suggestion_model(allowed: tuple[str, ...]) -> type[BaseModel]:
    """Pydantic model whose `category` is a Literal of `allowed` — Claude cannot answer outside it."""
    return create_model(
        "CategorySuggestion",
        category=(Literal[allowed], Field(description="Best-fit category for the transaction.")),
        confidence=(float, Field(ge=0, le=1, description="0-1 confidence in the choice.")),
    )


async def suggest_category(
    *,
    description: str,
    amount: Decimal,
    txn_type: str,
    allowed: tuple[str, ...],
) -> tuple[str, float] | None:
    """Ask Claude for (category_name, confidence), or None when AI is unavailable/failed.

    `category_name` is guaranteed to be one of `allowed`.
    """
    if not settings.ANTHROPIC_API_KEY:
        logger.info("ANTHROPIC_API_KEY not set — skipping AI categorization.")
        return None
    if not allowed:
        return None

    user_prompt = (
        f'Transaction description: "{description}"\n'
        f"Amount: {amount} BDT\n"
        f"Type: {txn_type}\n"
        f"Allowed categories: {', '.join(allowed)}\n"
        "Categorize this transaction."
    )

    try:
        response = await _get_client().messages.parse(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=256,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
            output_format=_suggestion_model(allowed),
        )
    except anthropic.RateLimitError:
        logger.warning("AI categorization rate-limited; using fallback.")
        return None
    except anthropic.APIStatusError as exc:
        logger.warning("AI categorization API error %s (%s); using fallback.", exc.status_code, exc.type)
        return None
    except anthropic.APIConnectionError as exc:
        logger.warning("AI categorization connection error (%s); using fallback.", exc)
        return None
    except Exception:  # noqa: BLE001 — last resort: the request path must never 500 on AI issues
        logger.exception("Unexpected AI categorization failure; using fallback.")
        return None

    parsed = response.parsed_output
    if parsed is None:
        logger.warning("AI returned no structured output (stop_reason=%s); using fallback.", response.stop_reason)
        return None
    return parsed.category, parsed.confidence
