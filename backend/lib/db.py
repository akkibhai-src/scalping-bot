"""MongoDB connection shared across the backend.

Uses AsyncIOMotorClient for non-blocking I/O.
The MongoDB connection URI is provided through MONGODB_URI.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI environment variable is required")

# Production-safe timeouts for MongoDB Atlas / cloud MongoDB.
client: AsyncIOMotorClient[Any] = AsyncIOMotorClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=10000,
    connectTimeoutMS=10000,
    socketTimeoutMS=30000,
)

# Single database used by the application.
db: AsyncIOMotorDatabase[Any] = client["scalping_bot"]
