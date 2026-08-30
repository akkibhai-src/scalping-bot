"""CoinDCX credentials + live-trading switch, editable at runtime from the UI.

Values live in Mongo (`settings` collection) so keys can be rotated without a redeploy.
`backend/.env` still works as a fallback, and env values win only when the database has
nothing stored. The secret is never returned to the client — only a masked tail.
"""
from __future__ import annotations

import os
from typing import Any

from lib.db import db

_DOC_ID = "coindcx"
_cache: dict[str, Any] = {"api_key": "", "api_secret": "", "live_trading": False, "loaded": False}


def mask(value: str) -> str:
    if not value:
        return ""
    return f"{'*' * max(4, len(value) - 4)}{value[-4:]}"


async def load() -> None:
    doc = None
    try:
        doc = await db.settings.find_one({"_id": _DOC_ID})
    except Exception:
        doc = None
    if doc:
        _cache.update(
            api_key=doc.get("api_key") or "",
            api_secret=doc.get("api_secret") or "",
            live_trading=bool(doc.get("live_trading")),
        )
    else:
        _cache.update(
            api_key=os.environ.get("COINDCX_API_KEY", ""),
            api_secret=os.environ.get("COINDCX_API_SECRET", ""),
            live_trading=os.environ.get("LIVE_TRADING", "false").lower() == "true",
        )
    _cache["loaded"] = True


async def ensure_loaded() -> None:
    """Retry Mongo-backed loading when startup happened before Mongo was ready."""
    if not configured():
        await load()


async def save(api_key: str, api_secret: str) -> None:
    _cache.update(api_key=api_key.strip(), api_secret=api_secret.strip())
    await db.settings.update_one(
        {"_id": _DOC_ID},
        {"$set": {"api_key": _cache["api_key"], "api_secret": _cache["api_secret"]}},
        upsert=True,
    )


async def clear() -> None:
    _cache.update(api_key="", api_secret="", live_trading=False)
    await db.settings.update_one(
        {"_id": _DOC_ID},
        {"$set": {"api_key": "", "api_secret": "", "live_trading": False}},
        upsert=True,
    )


async def set_live(on: bool) -> None:
    _cache["live_trading"] = bool(on) and configured()
    await db.settings.update_one(
        {"_id": _DOC_ID}, {"$set": {"live_trading": _cache["live_trading"]}}, upsert=True
    )


def credentials() -> tuple[str, str]:
    return str(_cache["api_key"]), str(_cache["api_secret"])


def configured() -> bool:
    return bool(_cache["api_key"] and _cache["api_secret"])


def live_enabled() -> bool:
    return bool(_cache["live_trading"]) and configured()


def status() -> dict[str, Any]:
    return {
        "configured": configured(),
        "api_key_masked": mask(str(_cache["api_key"])),
        "api_secret_masked": mask(str(_cache["api_secret"])),
        "live_trading": live_enabled(),
    }
