# Production Setup

## Checklist before live trading

- paper mode has been tested
- credentials are valid
- the futures wallet has real INR margin
- the strategy values are intentionally small at first
- `LIVE_TRADING` is still off until the final live check
- there is a clean emergency-stop path

## Required environment

```env
MONGO_URL="mongodb://127.0.0.1:27017"
DB_NAME="scalping"
CORS_ORIGINS="http://localhost:3000"
APP_URL="http://localhost:3000"
COINDCX_API_KEY="..."
COINDCX_API_SECRET="..."
COINDCX_BASE_URL="https://api.coindcx.com"
LIVE_TRADING=false
ADMIN_EMAIL="admin"
ADMIN_PASSWORD="kunal"
```

Never commit this file to git. It contains real trading keys.

## Install dependencies

```bash
cd /workspaces/codespaces-blank/Scalping-main/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Validate CoinDCX access

```bash
curl -X POST http://127.0.0.1:8001/api/bot/credentials/validate
```

This is the real preflight check for live trading. It confirms the keys are accepted and the futures wallet is readable.

## Start the app

Backend:

```bash
cd /workspaces/codespaces-blank/Scalping-main/backend
source .venv/bin/activate
python -m uvicorn server:app --host 0.0.0.0 --port 8001
```

Frontend:

```bash
cd /workspaces/codespaces-blank/Scalping-main/frontend
npm install
npm run dev -- --host 0.0.0.0 --port 3000
```

## Real-money activation

Only after the credentials validate and paper mode has been stable:

```env
LIVE_TRADING=true
```

Then restart backend. The app then moves into the live execution state and the bot can send real orders.

## Live order safety rules

- entries are capped by the actual free INR futures wallet balance
- strategy values remain user-defined; the code does not replace them with a hidden fixed leverage
- order quantity and entry price are rounded to CoinDCX tick and step rules
- if the account has too little usable margin, the bot skips the trade

## CoinDCX live payload contract

This is the actual live contract the app uses for futures order creation:

```json
{
  "order": {
    "side": "sell",
    "pair": "B-BTC_USDT",
    "order_type": "market_order",
    "total_quantity": 0.02,
    "leverage": 10,
    "notification": "no_notification",
    "time_in_force": "good_till_cancel",
    "hidden": false,
    "post_only": false,
    "margin_currency_short_name": "INR"
  }
}
```

And for TP/SL:

```json
{
  "id": "position_123",
  "take_profit": {
    "stop_price": 81000.0,
    "order_type": "take_profit_market"
  },
  "stop_loss": {
    "stop_price": 76000.0,
    "order_type": "stop_market"
  }
}
```

## Operational controls

- `/api/bot/state` — mode and strategy state
- `/api/bot/positions` — open and pending positions
- `/api/bot/logs` — recent execution logs
- `/api/bot/credentials/live` — toggle live execution mode
- `/api/bot/credentials/validate` — validate credentials before live trading

## Emergency stop

If the bot behaves wrong, stop it immediately:

```bash
# disable bot in UI
# or set LIVE_TRADING=false and restart backend
# or close positions manually on CoinDCX
```

## Production advice

Start with a very small capital allocation and monitor the bot live. Real-money execution is governed by actual CoinDCX wallet balance, not by any fixed template leverage or by the app’s default values alone.



---

## 🔐 Security Checklist

- [ ] API keys stored in `.env` (not git)
- [ ] IP whitelisting enabled in CoinDCX
- [ ] Two-factor authentication enabled
- [ ] Paper mode tested thoroughly
- [ ] Small capital allocation first
- [ ] 24-hour monitoring window
- [ ] Emergency stop procedure documented
- [ ] Regular backups of logs

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| API 401 Unauthorized | Check API key/secret, verify IP whitelisting |
| API 400 Bad Request | Order parameters wrong (we fixed this ✅) |
| Orders not filling | Check capital, leverage, price ticks |
| WebSocket disconnects | Normal, auto-reconnects in 3s |
| High latency | Close other apps, check internet |
| Position stuck | Manually close in CoinDCX, restart bot |

---

## 📞 Contact & Support

- CoinDCX Support: https://support.coindcx.com
- Docs: https://docs.coindcx.com
- Status: https://status.coindcx.com

---

## ✅ Final Checklist Before Going Live

- [ ] MongoDB running
- [ ] Backend tests passing (24/24)
- [ ] `.env` file created with real credentials
- [ ] Paper mode tested for 24+ hours
- [ ] No errors in logs
- [ ] Frontend shows correct data
- [ ] Strategy parameters verified
- [ ] Capital allocated (small amount)
- [ ] Read all warnings above
- [ ] Ready to monitor 24/7

---

**Good luck! 🚀 Trade smart, not hard.**
