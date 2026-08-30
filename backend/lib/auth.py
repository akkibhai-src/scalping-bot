from __future__ import annotations

import os
from typing import Any

from lib.db import db

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin").strip().lower()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "kunal")


async def ensure_admin_user() -> dict[str, Any]:
    payload = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD,
        "role": "admin",
        "active": True,
    }
    try:
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": payload}, upsert=True)
    except Exception:
        pass
    return payload


async def validate_admin_login(email: str, password: str) -> bool:
    normalized_email = (email or "").strip().lower()
    normalized_password = (password or "").strip()

    if normalized_email == ADMIN_EMAIL and normalized_password == ADMIN_PASSWORD:
        await ensure_admin_user()
        return True

    try:
        user = await db.users.find_one({"email": normalized_email})
    except Exception:
        user = None

    if not user:
        return False

    return str(user.get("email", "")).lower() == normalized_email and str(user.get("password", "")) == normalized_password
