import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TIMEFRAMES } from "@/lib/botTypes";
import type { CoinPick, OrderType, RuleSet, Strategy, StrategyCreate, Timeframe } from "@/lib/botTypes";

const PICK_LABEL: Record<CoinPick, string> = {
  top_loser: "Top loser (biggest 24h fall)",
  top_gainer: "Top gainer (biggest 24h rise)",
};

const TF_HINT: Record<Timeframe, string> = {
  "5m": "scans at :04, trades at :05 — every 5 minutes",
  "15m": "scans at :14, trades at :15 — every 15 minutes",
  "30m": "scans at :29, trades at :30 — every 30 minutes",
  "1h": "scans at :59, trades on the hour",
  "4h": "scans 1 min before 00:00, 04:00, 08:00 …",
  "1d": "scans once per day at the daily candle boundary",
};

export default function AddStrategyDialog({
  onCreate,
  editingStrategy,
  onUpdate,
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
  pending,
}: {
  onCreate: (body: StrategyCreate) => void;
  editingStrategy?: Strategy | null;
  onUpdate?: (id: string, body: StrategyCreate) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  pending: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [ruleSet, setRuleSet] = useState<RuleSet>("legacy");
  const [name, setName] = useState("Short 1% TP");
  const [coinPick, setCoinPick] = useState<CoinPick>("top_loser");
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [capital, setCapital] = useState("40000");
  const [leverage, setLeverage] = useState("10");
  const [tp, setTp] = useState("0.5");
  const [sl, setSl] = useState("5");
  const [maxTrades, setMaxTrades] = useState("5");
  const [target, setTarget] = useState("25000");
  const isEditing = Boolean(editingStrategy);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!editingStrategy) return;
    setStep(2);
    setRuleSet(editingStrategy.rule_set);
    setName(editingStrategy.name);
    setCoinPick(editingStrategy.coin_pick);
    setTimeframe(editingStrategy.timeframe);
    setOrderType(editingStrategy.order_type);
    setCapital(String(editingStrategy.capital_cap_inr));
    setLeverage(String(editingStrategy.leverage));
    setTp(String(editingStrategy.tp_pct));
    setSl(editingStrategy.sl_pct == null ? "" : String(editingStrategy.sl_pct));
    setMaxTrades(String(editingStrategy.max_trades_per_day));
    setTarget(String(editingStrategy.daily_target_inr));
  }, [editingStrategy]);

  const syncNameFromTimeframe = (selectedRuleSet: RuleSet, selectedTimeframe: Timeframe) => {
    if (selectedRuleSet === "top4_5m_reversal_short") {
      setName(`Top-4 Gainer ${selectedTimeframe} Reversal (SELL Only)`);
    }
  };

  const selectTemplate = (selectedRuleSet: RuleSet) => {
    setRuleSet(selectedRuleSet);
    if (selectedRuleSet === "top4_5m_reversal_short") {
      const nextTf: Timeframe = "5m";
      setName(`Top-4 Gainer ${nextTf} Reversal (SELL Only)`);
      setCoinPick("top_gainer");
      setTimeframe(nextTf);
      setOrderType("market");
      setTp("1.5");
      setSl("1");
    } else if (selectedRuleSet === "highest_mover_sell") {
      setName("Highest Mover Sell (Strategy 3)");
      setCoinPick("top_gainer");
      setTimeframe("5m");
      setOrderType("market");
      setTp("5");
      setSl("0");
    } else {
      setName("Short 1% TP");
      setCoinPick("top_loser");
      setTimeframe("1h");
      setOrderType("market");
      setTp("0.5");
      setSl("5");
    }
  };

  const submit = () => {
    const parsedCapital = Number(capital);
    const parsedLeverage = Number(leverage);
    const body: StrategyCreate = {
      name: name.trim() || "Strategy",
      rule_set: ruleSet,
      coin_pick: coinPick,
      timeframe,
      order_type: orderType,
      capital_cap_inr: Number.isFinite(parsedCapital) && parsedCapital > 0 ? parsedCapital : 40000,
      leverage: Number.isFinite(parsedLeverage) && parsedLeverage > 0 ? parsedLeverage : 10,
      tp_pct: Math.max(0.01, Number(tp) || 0.5),
      sl_pct: Number(sl) > 0 ? Number(sl) : null,
      max_trades_per_day: Math.min(20, Math.max(1, Number(maxTrades) || 5)),
      daily_target_inr: Math.max(0, Number(target) || 25000),
    };
    if (isEditing && editingStrategy && onUpdate) onUpdate(editingStrategy.id, body);
    else onCreate(body);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) { setStep(1); selectTemplate("legacy"); } }}>
      {showTrigger ? <DialogTrigger
        render={
          <Button size="sm" data-testid="add-strategy-trigger" disabled={pending}>
            <Plus className="h-3.5 w-3.5" />
            <span className="sr-only">Add strategy</span>
          </Button>
        }
      /> : null}
      <DialogContent className="border-[#1e293b] bg-[#111724] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{isEditing ? "Edit strategy" : "New strategy"}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {step === 1
              ? "Select a strategy template to continue."
              : "Review and edit the risk settings before creating the strategy."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && !isEditing ? (
          <div className="grid gap-2">
            <button type="button" onClick={() => selectTemplate("legacy")} className={`rounded border p-3 text-left ${ruleSet === "legacy" ? "border-[#7f9bff] bg-[#7f9bff]/10" : "border-[#1e293b] bg-[#0b0e14]"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">1. Existing strategy</span>
                <span className="num text-[10px] text-[#7f9bff]">SERIAL 1</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Old timeframe candle logic: Green = BUY, Red = SELL at candle close.</p>
            </button>
            <button type="button" onClick={() => selectTemplate("top4_5m_reversal_short")} className={`rounded border p-3 text-left ${ruleSet === "top4_5m_reversal_short" ? "border-[#00c076] bg-[#00c076]/10" : "border-[#1e293b] bg-[#0b0e14]"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">2. Top-4 Gainer 5m Reversal (SELL Only)</span>
                <span className="num text-[10px] text-[#00c076]">SERIAL 2</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Checks all four gainers for Green 5m then Red 5m, then waits for the 1m Green to Red entry punch.</p>
            </button>
            <button type="button" onClick={() => selectTemplate("highest_mover_sell")} className={`rounded border p-3 text-left ${ruleSet === "highest_mover_sell" ? "border-[#f0b35b] bg-[#f0b35b]/10" : "border-[#1e293b] bg-[#0b0e14]"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">3. Highest Mover Sell</span>
                <span className="num text-[10px] text-[#f0b35b]">SERIAL 3</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Daily or 5m cycle: scan all coins, lock the highest positive mover, sell at candle close with 2.5x and 5% TP.</p>
            </button>
            <p className="num text-[10px] text-slate-500">Click Serial 1 or Serial 2, then continue to review and create that strategy.</p>
          </div>
        ) : (
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="strategy-name" className="text-xs text-slate-400">Name</Label>
            <Input
              id="strategy-name"
              data-testid="strategy-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-[#1e293b] bg-[#0b0e14] text-sm"
            />
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs text-slate-400">Coin selection</Label>
            <Select value={coinPick} onValueChange={(value: string) => setCoinPick(value as CoinPick)}>
              <SelectTrigger data-testid="coin-pick-select" className="border-[#1e293b] bg-[#0b0e14] text-sm">
                <SelectValue>{(v) => PICK_LABEL[v as CoinPick]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top_loser">{PICK_LABEL.top_loser}</SelectItem>
                <SelectItem value="top_gainer">{PICK_LABEL.top_gainer}</SelectItem>
              </SelectContent>
            </Select>
            <p className="num text-[10px] text-slate-500">This rule always scans the top 4 gainers; the selected coin is chosen by the Green/Red matrix.</p>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs text-slate-400">Timeframe</Label>
            <div className="flex flex-wrap gap-1.5" data-testid="timeframe-group">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  data-testid={`strategy-timeframe-${tf}`}
                  aria-pressed={timeframe === tf}
                  onClick={() => {
                    setTimeframe(tf);
                    syncNameFromTimeframe(ruleSet, tf);
                  }}
                  className={
                    timeframe === tf
                      ? "num rounded border border-[#00c076]/50 bg-[#00c076]/12 px-2.5 py-1 text-[11px] font-semibold text-[#00c076]"
                      : "num rounded border border-[#1e293b] px-2.5 py-1 text-[11px] text-slate-400 transition-colors duration-150 hover:border-slate-600 hover:text-slate-200"
                  }
                >
                  {tf === "1d" ? "Daily" : tf}
                </button>
              ))}
            </div>
            <p className="num text-[10px] text-slate-500" data-testid="timeframe-hint">
              {TF_HINT[timeframe]} · GREEN candle → BUY, RED → SELL · limit order at the candle close
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs text-slate-400">Entry order type</Label>
            <Select value={orderType} onValueChange={(value: string) => setOrderType(value as OrderType)}>
              <SelectTrigger className="border-[#1e293b] bg-[#0b0e14] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">Market</SelectItem>
                <SelectItem value="limit">Limit</SelectItem>
              </SelectContent>
            </Select>
            <p className="num text-[10px] text-slate-500">The selected order type is used for live and paper entries.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="capital" className="text-xs text-slate-400">Capital cap (₹)</Label>
              <Input
                id="capital"
                data-testid="capital-input"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                className="num border-[#1e293b] bg-[#0b0e14] text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="leverage" className="text-xs text-slate-400">Leverage (max 10x)</Label>
              <Input
                id="leverage"
                data-testid="leverage-input"
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                className="num border-[#1e293b] bg-[#0b0e14] text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tp" className="text-xs text-slate-400">Take profit (%)</Label>
              <Input
                id="tp"
                data-testid="tp-input"
                value={tp}
                onChange={(e) => setTp(e.target.value)}
                className="num border-[#1e293b] bg-[#0b0e14] text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sl" className="text-xs text-slate-400">Stop loss (%)</Label>
              <Input
                id="sl"
                data-testid="sl-input"
                value={sl}
                onChange={(e) => setSl(e.target.value)}
                className="num border-[#1e293b] bg-[#0b0e14] text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="max-trades" className="text-xs text-slate-400">Max trades / day</Label>
              <Input
                id="max-trades"
                data-testid="max-trades-input"
                value={maxTrades}
                onChange={(e) => setMaxTrades(e.target.value)}
                className="num border-[#1e293b] bg-[#0b0e14] text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="target" className="text-xs text-slate-400">Daily target (₹)</Label>
              <Input
                id="target"
                data-testid="daily-target-input"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="num border-[#1e293b] bg-[#0b0e14] text-sm"
              />
            </div>
          </div>
        </div>
        )}

        <DialogFooter>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)} data-testid="cancel-strategy-button">
            Cancel
          </Button>
          {step === 1 ? (
            <Button size="sm" onClick={() => setStep(2)} data-testid="strategy-next-button">
              Review and edit
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => setStep(1)} data-testid="strategy-back-button">
                Back
              </Button>
              <Button size="sm" onClick={submit} data-testid="save-strategy-button">
                {isEditing ? "Save changes" : "Create strategy"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
