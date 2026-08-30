"""Shared Mongo handle — import `client`/`db` from here (server.py, routers, seed.py).

This app supports either a local MongoDB instance or a cloud MongoDB URI. Set one of:
- MONGO_URL="mongodb://localhost:27017"
- MONGO_URL="mongodb+srv://..."  (or MONGO_URL_CLOUD / MONGO_CLOUD_URL)

The first non-empty value wins; if no Mongo env is supplied, we fall back to the local
MongoDB default used in local development.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent.parent / ".env")

mongo_url = (
    os.getenv("MONGO_URL")
    or os.getenv("MONGO_URI")
    or os.getenv("MONGO_CLOUD_URL")
    or os.getenv("MONGO_URL_CLOUD")
    or "mongodb://localhost:27017"
).strip()

if not mongo_url:
    mongo_url = "mongodb://localhost:27017"

db_name = os.getenv("DB_NAME", "app")
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000, connectTimeoutMS=2000, socketTimeoutMS=2000)
db = client[db_name]
