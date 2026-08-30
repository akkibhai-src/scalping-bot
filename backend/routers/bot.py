from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from lib.bot_engine import engine, now_ist
from lib.db import db
from lib import credentials as creds
from lib import wsutil
from lib import coindcx_trade as trade
from lib.historical_test import run_historical_test
from models.bot import (
    BotState,
    CredentialStatus,
    CredentialUpdate,
    CredentialValidation,
    DayPnl,
    LivePosition,
    LogEntry,
    Strategy,
    StrategyCreate,
    TodaySummary,
    ToggleRequest,
    Trade,
)

router = APIRouter(prefix="/bot", tags=["bot"])
logger = logging.getLogger(__name__)


class HistoricalTestRequest(BaseModel):
    strategy_id: str
    target_time: datetime


@router.post("/historical-test")
async def historical_test(body: HistoricalTestRequest) -> dict[str, object]:
    strategy = engine.strategies.get(body.strategy_id)
    if strategy is None:
        raise HTTPException(status_code=404, detail="strategy not found")
    try:
        return await run_historical_test(strategy, body.target_time)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"historical data test failed: {exc}") from exc


@router.get("/state", response_model=BotState)
async def get_state() -> BotState:
    return engine.state()


@router.post("/toggle", response_model=BotState)
async def toggle_bot(body: ToggleRequest) -> BotState:
    await engine.set_bot(body.on)
    return engine.state()


@router.get("/strategies", response_model=list[Strategy])
async def list_strategies() -> list[Strategy]:
    return list(engine.strategies.values())


@router.post("/strategies", response_model=Strategy, status_code=201)
async def create_strategy(body: StrategyCreate) -> Strategy:
    strategy = Strategy(
        **body.model_dump(),
        created_at=now_ist().isoformat(timespec="seconds"),
    )
    return await engine.add(strategy)


@router.delete("/strategies/{sid}", status_code=204)
async def delete_strategy(sid: str) -> None:
    if not await engine.remove(sid):
        raise HTTPException(status_code=404, detail="strategy not found")


@router.post("/strategies/{sid}/enabled", response_model=Strategy)
async def set_enabled(sid: str, body: ToggleRequest) -> Strategy:
    strategy = await engine.set_enabled(sid, body.on)
    if strategy is None:
        raise HTTPException(status_code=404, detail="strategy not found")
    return strategy


@router.get("/logs", response_model=list[LogEntry])
async def get_logs(limit: int = Query(200, ge=1, le=1000)) -> list[LogEntry]:
    try:
        docs = await db.bot_logs.find().sort("ts", -1).to_list(limit)
        logs: list[LogEntry] = []
        for doc in reversed(docs):
            doc.pop("_id", None)
            try:
                logs.append(LogEntry(**doc))
            except Exception:
                continue
        return logs
    except Exception as exc:
        logger.warning("bot log history unavailable; using in-memory logs: %s", exc)
        return engine.logs[-limit:]


@router.get("/trades", response_model=list[Trade])
async def get_trades(limit: int = Query(50, ge=1, le=500), date: str | None = None) -> list[Trade]:
    query: dict[str, object] = {}
    if date:
        query["opened_at"] = {"$regex": f"^{date}"}
    docs = await db.trades.find(query).sort("opened_at", -1).to_list(limit)
    trades: list[Trade] = []
    for doc in docs:
        doc.pop("_id", None)
        try:
            trades.append(Trade(**doc))
        except Exception as exc:
            logger.warning("invalid trade document skipped: %s", exc)
    return trades


@router.get("/credentials", response_model=CredentialStatus)
async def get_credentials() -> CredentialStatus:
    await creds.ensure_loaded()
    return CredentialStatus(**creds.status())


@router.post("/credentials", response_model=CredentialStatus)
async def set_credentials(body: CredentialUpdate) -> CredentialStatus:
    previous_key, previous_secret = creds.credentials()
    creds._cache.update(api_key=body.api_key.strip(), api_secret=body.api_secret.strip())
    try:
        await trade.validate_live_credentials()
    except Exception as exc:
        creds._cache.update(api_key=previous_key, api_secret=previous_secret)
        raise HTTPException(status_code=400, detail=f"Credential validation failed before saving: {exc}") from exc

    await creds.save(body.api_key, body.api_secret)
    engine.log("info", "CoinDCX API credentials saved (live trading still needs its toggle).")
    engine._push_state()
    return CredentialStatus(**creds.status())


@router.delete("/credentials", response_model=CredentialStatus)
async def delete_credentials() -> CredentialStatus:
    await creds.clear()
    engine.log("info", "CoinDCX API credentials removed — back to PAPER mode.")
    engine._push_state()
    return CredentialStatus(**creds.status())


@router.post("/credentials/validate", response_model=CredentialValidation)
async def validate_credentials(body: dict[str, str] | None = None) -> CredentialValidation:
    await creds.ensure_loaded()
    previous_key, previous_secret = creds.credentials()
    submitted_key = ""
    submitted_secret = ""

    if body:
        submitted_key = str(body.get("api_key", "")).strip()
        submitted_secret = str(body.get("api_secret", "")).strip()

    if submitted_key or submitted_secret:
        if not submitted_key or not submitted_secret:
            raise HTTPException(status_code=400, detail="add API key and secret before validating live trading")
        creds._cache.update(api_key=submitted_key, api_secret=submitted_secret)
    elif not creds.configured():
        raise HTTPException(status_code=400, detail="add API key and secret before validating live trading")

    try:
        info = await trade.validate_live_credentials()
        return CredentialValidation(**info)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Credential validation failed: {exc}") from exc
    finally:
        if submitted_key or submitted_secret:
            creds._cache.update(api_key=previous_key, api_secret=previous_secret)


@router.post("/credentials/live", response_model=CredentialStatus)
async def set_live_trading(body: ToggleRequest) -> CredentialStatus:
    await creds.ensure_loaded()
    if body.on and not creds.configured():
        raise HTTPException(status_code=400, detail="add API key and secret before enabling live trading")
    if body.on:
        try:
            await trade.validate_live_credentials()
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Live trading confirmation failed: {exc}") from exc
    await creds.set_live(body.on)
    engine.log(
        "info",
        f"Execution mode switched to {'LIVE ORDERS — real money at risk' if creds.live_enabled() else 'PAPER'}.",
    )
    engine._push_state()
    return CredentialStatus(**creds.status())


@router.get("/positions", response_model=list[LivePosition])
async def get_positions() -> list[LivePosition]:
    return engine.positions()


@router.get("/history/today", response_model=TodaySummary)
async def today_summary() -> TodaySummary:
    now = now_ist()
    today = now.date().isoformat()
    docs = await db.trades.find({"opened_at": {"$regex": f"^{today}"}}).sort("opened_at", 1).to_list(200)
    trades: list[Trade] = []
    for doc in docs:
        doc.pop("_id", None)
        trades.append(Trade(**doc))
    pnl = sum(t.pnl_inr or 0 for t in trades)
    target = max((s.daily_target_inr for s in engine.strategies.values()), default=25000.0)
    max_trades = max((s.max_trades_per_day for s in engine.strategies.values()), default=5)
    return TodaySummary(
        date=today,
        server_time_ist=now.isoformat(timespec="seconds"),
        pnl_inr=pnl,
        target_inr=target,
        target_achieved=target > 0 and pnl >= target,
        trades_done=len([t for t in trades if t.status != "open"]),
        max_trades=max_trades,
        open_trades=len([t for t in trades if t.status == "open"]),
        trades=trades,
    )


@router.get("/history/daily", response_model=list[DayPnl])
async def daily_history(days: int = Query(120, ge=1, le=400)) -> list[DayPnl]:
    """Per-day realised P&L, newest last — drives the calendar heat map."""
    since = (now_ist() - timedelta(days=days)).date().isoformat()
    docs = await db.trades.find({"opened_at": {"$gte": since}}).to_list(5000)
    buckets: dict[str, DayPnl] = {}
    for doc in docs:
        day = str(doc.get("opened_at", ""))[:10]
        if not day:
            continue
        bucket = buckets.setdefault(day, DayPnl(date=day, pnl_inr=0, trades=0, wins=0, losses=0))
        bucket.trades += 1
        pnl = doc.get("pnl_inr")
        if pnl is None:
            continue
        bucket.pnl_inr += float(pnl)
        if float(pnl) >= 0:
            bucket.wins += 1
        else:
            bucket.losses += 1
    return [buckets[key] for key in sorted(buckets)]


@router.websocket("/ws")
async def bot_ws(websocket: WebSocket) -> None:
    await websocket.accept()
    wsutil.register(websocket)
    queue = engine.subscribe()
    try:
        await websocket.send_text(json.dumps({"type": "state", "state": engine.state().model_dump()}))
        await websocket.send_text(json.dumps({"type": "positions", "positions": [position.model_dump() for position in engine.positions()]}))
        await websocket.send_text(
            json.dumps({"type": "backlog", "logs": [log.model_dump() for log in engine.logs[-200:]]})
        )
        while True:
            payload = await wsutil.next_payload(queue)
            if payload is None:
                break
            await websocket.send_text(payload)
    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    except Exception:
        pass
    finally:
        engine.unsubscribe(queue)
        wsutil.unregister(websocket)
