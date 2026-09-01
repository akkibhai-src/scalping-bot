"""Centralized app and CoinDCX configuration."""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env", override=False)

APP_URL = os.environ.get("APP_URL", "http://localhost:3000")

COINDCX_PUBLIC_BASE_URL = "https://public.coindcx.com"
COINDCX_API_BASE_URL = os.environ.get("COINDCX_BASE_URL", "https://api.coindcx.com")
COINDCX_WS_URL = os.environ.get("COINDCX_WS_URL", "https://stream.coindcx.com")
COINDCX_WS_PRICE_CHANNEL = os.environ.get("COINDCX_WS_PRICE_CHANNEL", "currentPrices@futures@rt")

CANDLES_URL = f"{COINDCX_PUBLIC_BASE_URL}/market_data/candlesticks"
PRICES_URL = f"{COINDCX_PUBLIC_BASE_URL}/market_data/v3/current_prices/futures/rt"
