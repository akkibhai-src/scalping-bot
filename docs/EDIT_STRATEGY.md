# How to edit the strategy — the 4 places that matter

Everything about the strategy lives in **one file**: `backend/lib/bot_engine.py`.
Edit it, save, and uvicorn hot-reloads — no build, no restart, no redeploy in preview.

## 1. Timing (slots, scan lead, fill window)
Top of the file:

```python
WINDOW_START = dtime(5, 30)      # trading window opens (IST)
WINDOW_END   = dtime(3, 40)      # closes next day
TF_MINUTES   = {"5m": 5, "15m": 15, "1h": 60, "4h": 240}   # slot spacing per timeframe
ORDER_WINDOW = {"5m": 60, "15m": 120, "1h": 300, "4h": 300} # seconds a limit order may sit unfilled
PRESCAN_LEAD = 60                # seconds before the slot that the top-4 scan runs
```

Want the 1h slot at :30 instead of :00? Change `next_slot()` to anchor on the half hour,
and read a :30-aligned candle (merge two 30m candles) in `_select()`.

## 2. Which coins get scanned
`BotEngine._ranked()` — currently the top 4 gainers or losers from the live scanner,
chosen by the strategy's `coin_pick`. Change the slice or the sort here (e.g. filter by
volume, exclude pairs, take 6 instead of 4).

## 3. The entry rule
`candle_side()` decides direction — GREEN candle → `buy`, RED → `sell`, flat → skip.
`BotEngine._select()` picks **which** candidate to trade (today: strongest absolute 24h
mover) and then calls `_place()` with the candle's closing price.
Add filters here — volume, candle body size, RSI, "only trade if body > 0.3%", etc.

## 4. TP / SL, sizing and exits
- `tp_sl_for()` — TP and SL from entry and side. Percentages come from the strategy
  (`tp_pct`, `sl_pct`), editable per strategy in the Add Strategy dialog.
- `pnl_pct_for()` — P&L maths (move × leverage).
- `_place()` — order placement, capital (`min(strategy cap, ₹40,000, free INR margin)`)
  and leverage (`10x` or the pair's max if lower). Quantity comes from
  `coindcx_trade.order_quantity()`.
- `_await_fill()` — the fill window and cancellation.
- `_monitor()` — the exit checks; it runs every 2 seconds against the live price.

## Where each other piece lives
| Concern | File |
|---|---|
| Signed CoinDCX calls (orders, cancel, positions, wallet) | `backend/lib/coindcx_trade.py` |
| API keys + live switch (DB-backed) | `backend/lib/credentials.py` |
| Candle fetching / cache / 2h synthesis | `backend/lib/candles.py` |
| Live price feed the bot reads | `backend/lib/market_store.py` |
| HTTP + WebSocket endpoints | `backend/routers/bot.py` |
| Strategy fields and validation | `backend/models/bot.py` (mirror any new field in `frontend/src/lib/botTypes.ts`) |

## Safe way to test a change
1. Keep live trading OFF (API Keys dialog → "Go paper"). PAPER mode runs the identical
   decision path with simulated fills, so logs tell you exactly what would have happened.
2. Create a strategy on the **5m** timeframe — you get a slot every 5 minutes instead of
   waiting an hour.
3. Watch `/bot` (log console) and `/position` (candles with entry/TP/SL).
4. Only then switch to live, and start with a reduced capital cap.

## Adding a whole second strategy type
`_select()` is the decision point. The cleanest split is to give `Strategy` a
`kind` field (e.g. `"candle_break"`, `"ema_cross"`), then branch in `_select()` to a
separate `_select_ema_cross()`. Everything downstream (`_place`, `_await_fill`,
`_monitor`, logging, history) is strategy-agnostic and needs no changes.
