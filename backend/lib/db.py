"""MongoDB connection shared across the backend.

Uses AsyncIOMotorClient for non-blocking I/O. The database name is read from the
MONGODB_URI (last path segment) or falls back to MONGODB_DATABASE / 'scalping_bot'.
"""
from __future__ import annotations

import logging
import os
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/scalping_bot")
MONGODB_DATABASE = os.environ.get("MONGODB_DATABASE", "scalping_bot")

# FIX P2-12: Increase timeouts from 2s to production-safe values.
# Cloud MongoDB (Atlas) can have slow network or maintenance windows.
# 2-second timeouts caused startup failures and connection drops.
client: AsyncIOMotorClient[Any] = AsyncIOMotorClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=10000,
    connectTimeoutMS=10000,
    socketTimeoutMS=30000,
)

db: AsyncIOMotorDatabase[Any] = client.get_default_database(default=MONGODB_DATABASE)
