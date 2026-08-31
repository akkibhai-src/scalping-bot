"""Public CoinDCX market data (no auth required).

Used by the live scanner and the market-store to keep real-time prices, 24h
changes, and leverage information in memory.
"""
from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

BASE = "https://api.coindcx.com"


async def fetch_tickers() -> list[dict[str, Any]]:
    """Return the full futures ticker list from CoinDCX."""
    async with httpx.AsyncClient(base_url=BASE, timeout=15) as http:
        res = await http.get("/exchange/ticker")
        res.raise_for_status()
        data = res.json()
    return data if isinstance(data, list) else []


async def fetch_leverage(pair: str) -> dict[str, Any]:
    """Fetch leverage details for a futures pair.

    FIX P1-6: Use INR margin instead of USDT so the displayed max_leverage
    matches what the bot actually uses for INR-margin trading. Previously
    this fetched USDT leverage, which could differ from INR leverage and
    confused the UI (showing one leverage while the bot computed another).
    """
    async with httpx.AsyncClient(base_url=BASE, timeout=15) as http:
        res = await http.get(
            "/exchange/v1/derivatives/futures/data/instrument",
            params={
                "pair": pair,
                # FIX: was "USDT", now "INR" to match the bot's margin currency
                "margin_currency_short_name": "INR",
            },
        )
        res.raise_for_status()
    payload = res.json() or {}
    if isinstance(payload, dict):
        detail = payload.get("instrument") or payload.get("data")
        if isinstance(detail, dict):
            return detail
        if isinstance(detail, list):
            for item in detail:
                if isinstance(item, dict) and str(item.get("pair") or "") == pair:
                    return item
        if any(key in payload for key in ("max_leverage_long", "max_leverage_short", "dynamic_position_leverage_details")):
            return payload
    return {}
