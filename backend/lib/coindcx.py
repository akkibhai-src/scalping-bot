"""CoinDCX futures market data: active instruments, leverage metadata, live prices."""
from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from lib.db import db

logger = logging.getLogger(__name__)

API_BASE = "https://api.coindcx.com/exchange/v1/derivatives/futures/data"
PRICES_URL = "https://public.coindcx.com/market_data/v3/current_prices/futures/rt"

ACTIVE_INSTRUMENTS_URL = f"{API_BASE}/active_instruments?margin_currency_short_name[]=USDT"


def _instrument_url(pair: str) -> str:
    return f"{API_BASE}/instrument?pair={pair}&margin_currency_short_name=USDT"


async def fetch_active_instruments(http: httpx.AsyncClient) -> list[str]:
    res = await http.get(ACTIVE_INSTRUMENTS_URL)
    res.raise_for_status()
    data = res.json()
    if isinstance(data, dict):  # defensive: some deployments wrap the list
        data = data.get("instruments", [])
    return [str(p) for p in data if isinstance(p, str) and p.endswith("_USDT")]


async def fetch_prices(http: httpx.AsyncClient) -> dict[str, Any]:
    res = await http.get(PRICES_URL)
    res.raise_for_status()
    payload = res.json()
    prices = payload.get("prices") or {}
    return {"ts": int(payload.get("ts") or 0), "prices": prices}


def _max_leverage(instrument: dict[str, Any]) -> int | None:
    for key in ("max_leverage_long", "max_leverage_short"):
        value = instrument.get(key)
        if isinstance(value, (int, float)) and value > 0:
            return int(value)
    levels = instrument.get("dynamic_position_leverage_details")
    if isinstance(levels, dict) and levels:
        try:
            return max(int(k) for k in levels.keys())
        except ValueError:
            return None
    return None


async def load_cached_leverage() -> dict[str, int]:
    docs = await db.instrument_meta.find().to_list(5000)
    return {d["pair"]: d["max_leverage"] for d in docs if d.get("max_leverage")}


async def fetch_leverage(http: httpx.AsyncClient, pairs: list[str]) -> dict[str, int]:
    """Fetch max leverage per pair (one call each, bounded concurrency) and cache it."""
    out: dict[str, int] = {}
    sem = asyncio.Semaphore(12)

    async def one(pair: str) -> None:
        async with sem:
            try:
                res = await http.get(_instrument_url(pair))
                res.raise_for_status()
                instrument = (res.json() or {}).get("instrument") or {}
            except Exception:
                return
            lev = _max_leverage(instrument)
            if lev:
                out[pair] = lev

    await asyncio.gather(*(one(p) for p in pairs))

    if out:
        try:
            for pair, lev in out.items():
                await db.instrument_meta.update_one(
                    {"pair": pair}, {"$set": {"pair": pair, "max_leverage": lev}}, upsert=True
                )
        except Exception as exc:  # cache is best-effort
            logger.warning("leverage cache write failed: %s", exc)
    return out
