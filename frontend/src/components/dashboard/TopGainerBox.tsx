import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CandleChart from "@/components/dashboard/CandleChart";
import { Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import { apiGet } from "@/lib/api";
import { RESOLUTIONS, fmtCompact, fmtPct, fmtPrice } from "@/lib/types";
import type { CandleSeries, Resolution, Ticker } from "@/lib/types";
import { cn } from "@/lib/utils";

const RANK_ACCENT = ["#F5C451", "#C7D2DC", "#CD7F45", "#00C076"];

function Metric({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <span
        data-testid={`ohlc-${label.toLowerCase()}`}
        className={cn(
          "num truncate text-[12px] font-medium",
          tone === "up" ? "text-[#00c076]" : tone === "down" ? "text-[#ff455b]" : "text-[#e2e8f0]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export default function TopGainerBox({
  ticker,
  rank,
  resolution,
  onResolutionChange,
}: {
  ticker: Ticker;
  rank: number;
  resolution: Resolution;
  onResolutionChange: (value: Resolution) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const up = ticker.change_pct >= 0;
  const accent = RANK_ACCENT[rank - 1] ?? "#00C076";

  useEffect(() => {
    if (!expanded) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [expanded]);

  const series = useQuery({
    queryKey: ["candles", ticker.pair, resolution],
    queryFn: () =>
      apiGet<CandleSeries>(`/market/candles/${ticker.pair}?resolution=${resolution}&limit=60`),
    refetchInterval: 10_000,
    retry: false,
    placeholderData: (prev) => prev,
  });

  return (
    <div
      data-testid="top-gainer-box"
      data-pair={ticker.pair}
      role="button"
      tabIndex={0}
      aria-label={`${ticker.symbol} details. Click to ${expanded ? "minimize" : "expand"}`}
      onClick={() => setExpanded((value) => !value)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setExpanded((value) => !value);
        }
      }}
      className={cn(
        "flex min-h-0 flex-col gap-2 rounded-lg border border-[#1e293b] bg-[#111724] p-2.5 transition-[border-color] duration-200 hover:border-[#00c076]/40",
        expanded && "fixed inset-3 z-50 overflow-y-auto shadow-2xl shadow-black/60 sm:inset-5 lg:inset-8",
      )}
      style={{
        boxShadow: `inset 2px 0 0 0 ${accent}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="num text-[13px] font-semibold text-white" data-testid="top-box-symbol">
            {ticker.symbol}
          </span>
          <span className="num text-[10px] text-slate-500">
            {ticker.max_leverage ? `${ticker.max_leverage}x max lev.` : "leverage —"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <>
              <button
                type="button"
                title="Zoom out"
                aria-label="Zoom out"
                disabled={zoom <= 0.85}
                onClick={(event) => {
                  event.stopPropagation();
                  setZoom((value) => Math.max(0.85, Number((value - 0.15).toFixed(2))));
                }}
                className="grid size-6 place-items-center rounded text-slate-400 hover:bg-[#1e293b] hover:text-white disabled:opacity-40"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <button
                type="button"
                title="Zoom in"
                aria-label="Zoom in"
                disabled={zoom >= 1.5}
                onClick={(event) => {
                  event.stopPropagation();
                  setZoom((value) => Math.min(1.5, Number((value + 0.15).toFixed(2))));
                }}
                className="grid size-6 place-items-center rounded text-slate-400 hover:bg-[#1e293b] hover:text-white disabled:opacity-40"
              >
                <ZoomIn className="size-3.5" />
              </button>
              <button
                type="button"
                title={expanded ? "Minimize card" : "Expand card"}
                aria-label={expanded ? "Minimize card" : "Expand card"}
                onClick={(event) => {
                  event.stopPropagation();
                  setExpanded((value) => !value);
                }}
                className="grid size-6 place-items-center rounded text-slate-400 hover:bg-[#1e293b] hover:text-white"
              >
                {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              </button>
          </>
          <span
            className="num rounded px-1.5 py-0.5 text-[10px] font-bold"
            style={{ color: accent, backgroundColor: `${accent}1F` }}
            data-testid="top-box-rank"
          >
            #{rank}
          </span>
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 border-b border-[#1e293b]/60 pb-1.5">
        <div className="min-w-0">
          <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-slate-500">Last Price</div>
          <span className="num block text-[17px] font-semibold leading-tight text-white" data-testid="top-box-price">
            {fmtPrice(ticker.last)}
          </span>
        </div>

        <div className="min-w-0 text-right">
          <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-slate-500">24h Change</div>
          <span
            data-testid="top-box-change"
            className={cn(
              "num mt-0.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[12px] font-semibold leading-tight",
              up ? "bg-[#00c076]/10 text-[#00c076]" : "bg-[#ff455b]/10 text-[#ff455b]",
            )}
          >
            {up ? "↑" : "↓"}
            {fmtPct(ticker.change_pct)}
          </span>
        </div>
      </div>

      <div
        className="rounded-md border border-[#1e293b] bg-[#0b0e14] p-0.5"
        role="group"
        aria-label={`Timeframe for ${ticker.symbol}`}
        data-testid="timeframe-selector"
      >
        <div className="flex flex-wrap gap-0.5">
          {RESOLUTIONS.map((r) => (
            <button
              key={r}
              type="button"
              data-testid={`timeframe-${r}-button`}
              aria-pressed={resolution === r}
              onClick={(event) => {
                event.stopPropagation();
                onResolutionChange(r);
              }}
              className={cn(
                "num flex-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors duration-150",
                resolution === r
                  ? "bg-[#00c076]/15 text-[#00c076]"
                  : "text-slate-500 hover:bg-[#1e293b] hover:text-slate-200",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <CandleChart
        candles={series.data?.candles ?? []}
        ticker={ticker}
        loading={series.isPending}
        height={expanded ? Math.round(260 * zoom) : 76}
      />

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-[#1e293b] pt-2">
        <Metric label="Open" value={fmtPrice(ticker.open)} />
        <Metric label="High" value={fmtPrice(ticker.high)} tone="up" />
        <Metric label="Low" value={fmtPrice(ticker.low)} tone="down" />
        <Metric label="Close" value={fmtPrice(ticker.last)} />
      </div>

      <div className="num flex items-center justify-between text-[10px] text-slate-500">
        <span>Vol {fmtCompact(ticker.volume)}</span>
        <span>Funding {(ticker.funding_rate * 100).toFixed(4)}%</span>
      </div>
    </div>
  );
}
