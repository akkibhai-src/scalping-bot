import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Bot, History, LogOut, Radio, TrendingDown, TrendingUp } from "lucide-react";
import InstrumentTable from "@/components/dashboard/InstrumentTable";
import TopGainerBox from "@/components/dashboard/TopGainerBox";
import { buttonVariants } from "@/components/ui/button";
import { useMarketStream } from "@/hooks/useMarketStream";
import { fmtPct } from "@/lib/types";
import type { Resolution, Ticker } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEFAULT_RESOLUTION: Resolution = "5m";
const TIMEFRAME_STORAGE_KEY = "scalping-timeframes";

function istClock(): string {
  return new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour12: false });
}

function loadTimeframes(): Record<string, Resolution> {
  try {
    const saved = JSON.parse(localStorage.getItem(TIMEFRAME_STORAGE_KEY) ?? "{}");
    return typeof saved === "object" && saved !== null ? saved : {};
  } catch {
    return {};
  }
}

const STATE_LABEL = {
  connecting: "Connecting to CoinDCX stream…",
  live: "Live · wss stream from CoinDCX",
  offline: "Stream offline · retrying",
} as const;

function StatChip({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <span
        className={cn(
          "num text-[12px] font-semibold",
          tone === "up" ? "text-[#008f59]" : tone === "down" ? "text-[#d9364a]" : "text-[#273142]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { snapshot, state, ticks } = useMarketStream();
  const [timeframes, setTimeframes] = useState<Record<string, Resolution>>(loadTimeframes);
  const [clock, setClock] = useState(istClock);

  useEffect(() => {
    const id = setInterval(() => setClock(istClock()), 1000);
    return () => clearInterval(id);
  }, []);

  const instruments: Ticker[] = snapshot?.instruments ?? [];
  const top: Ticker[] = snapshot?.top ?? [];
  const best = instruments[0];
  const worst = instruments[instruments.length - 1];

  return (
    <div className="terminal-shell flex h-screen flex-col overflow-hidden bg-[#0b0e14] text-slate-100">
      <header className="flex h-13 shrink-0 flex-wrap items-center gap-x-5 gap-y-1 border-b border-[#c4c8cf] bg-[#e3e5e8]/95 px-4 py-2 text-[#17202a] backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded bg-[#00c076]/15 text-[#00c076]">
            <Activity className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <h1 className="font-heading text-[13px] font-bold tracking-tight text-[#17202a]">
              CoinDCX Pro · Futures Scanner
            </h1>
            <p className="text-[10px] text-[#596273]">USDT perpetuals · live OHLC ranking</p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-1">
          <StatChip label="Pairs" value={String(snapshot?.count ?? 0)} />
          <StatChip
            label="Top gainer"
            value={best ? `${best.symbol} ${fmtPct(best.change_pct)}` : "—"}
            tone="up"
          />
          <StatChip
            label="Top loser"
            value={worst ? `${worst.symbol} ${fmtPct(worst.change_pct)}` : "—"}
            tone="down"
          />
          <StatChip label="Frames" value={String(ticks)} />
          <span
            data-testid="ws-status-badge"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
              state === "live"
                ? "border-[#00c076]/40 bg-[#00c076]/10 text-[#00c076]"
                : state === "connecting"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                  : "border-[#ff455b]/40 bg-[#ff455b]/10 text-[#ff455b]",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                state === "live"
                  ? "bg-[#00c076] animate-[beacon_1.6s_ease-in-out_infinite]"
                  : state === "connecting"
                    ? "bg-amber-400"
                    : "bg-[#ff455b]",
              )}
            />
            {STATE_LABEL[state]}
          </span>
          <Link
            to="/history"
            data-testid="history-link"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 w-7 p-0 text-[#334155] hover:text-[#17202a]")}
            aria-label="Trade history"
            title="Trade history"
          >
            <History className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/bot"
            data-testid="bot-control-link"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 w-7 p-0 text-[#334155]")}
            aria-label="Bot control"
            title="Bot control"
          >
            <Bot className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              window.location.assign("/login");
            }}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 w-7 p-0 text-[#334155]")}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-3 lg:grid-cols-12 lg:overflow-hidden">
        <section className="terminal-panel min-h-[65vh] lg:col-span-7 lg:min-h-0 xl:col-span-8">
          <InstrumentTable instruments={instruments} />
        </section>

        <section
          className="terminal-panel flex min-h-0 flex-col gap-2 lg:col-span-5 xl:col-span-4"
          role="region"
          aria-label="Top 4 Crypto Gainers"
        >
          <div className="flex items-center gap-2 px-0.5">
            <TrendingUp className="h-3.5 w-3.5 text-[#00c076]" />
            <h2 className="font-heading text-sm font-semibold tracking-tight text-slate-100">
              Top 4 Movers · Live OHLC
            </h2>
            <span className="num ml-auto text-[10px] text-slate-500">re-ranked every second</span>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-y-auto sm:grid-cols-2">
            {top.length > 0
              ? top.map((t, i) => (
                  <TopGainerBox
                    key={t.pair}
                    ticker={t}
                    rank={i + 1}
                    resolution={timeframes[t.pair] ?? DEFAULT_RESOLUTION}
                    onResolutionChange={(value) => {
                      setTimeframes((prev) => {
                        const next = { ...prev, [t.pair]: value };
                        localStorage.setItem(TIMEFRAME_STORAGE_KEY, JSON.stringify(next));
                        return next;
                      });
                    }}
                  />
                ))
              : [0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    data-testid="top-gainer-placeholder"
                    className="flex min-h-28 items-center justify-center rounded-lg border border-dashed border-[#1e293b] bg-[#0d111a] text-[11px] text-slate-600"
                  >
                    Awaiting stream…
                  </div>
                ))}
          </div>
        </section>
      </main>

      <footer
        data-testid="scanning-footer"
        className="flex h-9 shrink-0 items-center justify-between border-t border-[#1e293b] bg-[#090c11] px-4 text-[11px] num text-slate-400"
      >
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00c076] animate-[beacon_1.6s_ease-in-out_infinite]" />
          Scanning live from CoinDCX
        </span>
        <span className="inline-flex items-center gap-4">
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <Radio className="h-3 w-3 text-slate-500" /> wss://stream.coindcx.com
          </span>
          <span className="inline-flex items-center gap-1.5">
            <TrendingDown className="h-3 w-3 text-slate-500" />
            {clock}
          </span>
        </span>
      </footer>
    </div>
  );
}
