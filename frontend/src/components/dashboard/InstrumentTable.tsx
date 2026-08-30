import { useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fmtCompact, fmtPct, fmtPrice } from "@/lib/types";
import type { Ticker } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortKey = "change_pct" | "last" | "max_leverage" | "volume" | "symbol";
type FilterKey = "all" | "leverage" | "gainers" | "losers";

const FILTERS: { key: FilterKey; label: string; testid: string }[] = [
  { key: "all", label: "All", testid: "filter-all-button" },
  { key: "leverage", label: "Leverage > 20x", testid: "filter-high-leverage-button" },
  { key: "gainers", label: "Gainers", testid: "filter-gainers-button" },
  { key: "losers", label: "Losers", testid: "filter-losers-button" },
];

const MAX_ROWS = 200;

function SortHead({
  label,
  sortKey,
  active,
  desc,
  align,
  testid,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  active: boolean;
  desc: boolean;
  align?: "right";
  testid: string;
  onSort: (key: SortKey) => void;
}) {
  return (
    <th
      className={cn(
        "sticky top-0 z-10 select-none bg-[#0e131f] px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      <button
        type="button"
        data-testid={testid}
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors duration-150 hover:text-slate-100",
          active && "text-[#00c076]",
        )}
      >
        {label}
        {active ? (
          desc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
        ) : null}
      </button>
    </th>
  );
}

export default function InstrumentTable({ instruments }: { instruments: Ticker[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("change_pct");
  const [desc, setDesc] = useState(true);
  const prev = useRef<Map<string, number>>(new Map());

  const rows = useMemo(() => {
    const q = query.trim().toUpperCase();
    let list = instruments.filter((t) => (q ? t.symbol.includes(q) || t.pair.includes(q) : true));
    if (filter === "leverage") list = list.filter((t) => (t.max_leverage ?? 0) > 20);
    if (filter === "gainers") list = list.filter((t) => t.change_pct > 0);
    if (filter === "losers") list = list.filter((t) => t.change_pct < 0);

    const dir = desc ? -1 : 1;
    return [...list]
      .sort((a, b) => {
        if (sortKey === "symbol") return dir * a.symbol.localeCompare(b.symbol);
        const av = sortKey === "max_leverage" ? (a.max_leverage ?? 0) : a[sortKey];
        const bv = sortKey === "max_leverage" ? (b.max_leverage ?? 0) : b[sortKey];
        return dir * (av - bv);
      })
      .slice(0, MAX_ROWS);
  }, [instruments, query, filter, sortKey, desc]);

  const onSort = (key: SortKey) => {
    if (key === sortKey) setDesc((d) => !d);
    else {
      setSortKey(key);
      setDesc(true);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#1e293b] bg-[#0d111a]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1e293b] px-3 py-2.5">
        <h2 className="mr-auto font-heading text-sm font-semibold tracking-tight text-slate-100">
          Active USDT Futures
          <span className="ml-2 num text-[11px] text-slate-500" data-testid="instrument-count">
            {instruments.length} pairs
          </span>
        </h2>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <Input
            data-testid="instrument-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search BTC, SOL…"
            className="h-8 w-44 border-[#1e293b] bg-[#0b0e14] pl-8 text-xs num placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-[#1e293b] px-3 py-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            data-testid={f.testid}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors duration-150",
              filter === f.key
                ? "border-[#00c076]/50 bg-[#00c076]/12 text-[#00c076]"
                : "border-[#1e293b] text-slate-400 hover:border-slate-600 hover:text-slate-200",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto" data-testid="instrument-table-scroll">
        <table className="w-full border-collapse text-xs" role="table" aria-label="Active USDT Futures Instruments">
          <thead>
            <tr>
              <SortHead label="Instrument" sortKey="symbol" active={sortKey === "symbol"} desc={desc} testid="sort-symbol-button" onSort={onSort} />
              <SortHead label="Max Lev." sortKey="max_leverage" active={sortKey === "max_leverage"} desc={desc} align="right" testid="sort-leverage-button" onSort={onSort} />
              <SortHead label="Last Price" sortKey="last" active={sortKey === "last"} desc={desc} align="right" testid="sort-price-button" onSort={onSort} />
              <SortHead label="24h Change" sortKey="change_pct" active={sortKey === "change_pct"} desc={desc} align="right" testid="sort-change-button" onSort={onSort} />
              <th className="sticky top-0 z-10 bg-[#0e131f] px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">24h High</th>
              <th className="sticky top-0 z-10 bg-[#0e131f] px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">24h Low</th>
              <SortHead label="Volume" sortKey="volume" active={sortKey === "volume"} desc={desc} align="right" testid="sort-volume-button" onSort={onSort} />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const before = prev.current.get(t.pair);
              const tickUp = before !== undefined && t.last > before;
              const tickDown = before !== undefined && t.last < before;
              prev.current.set(t.pair, t.last);
              const up = t.change_pct >= 0;
              return (
                <tr
                  key={t.pair}
                  data-testid="instrument-row"
                  data-pair={t.pair}
                  className={cn(
                    "border-b border-[#141c29] transition-colors duration-150 hover:bg-[#161d2b]",
                    (rows.indexOf(t) + 1) % 2 === 0 ? "bg-[#0f172a]/20" : "bg-transparent",
                  )}
                >
                  <td className="px-3 py-1.5">
                    <span className="num text-[12px] font-semibold text-slate-100">{t.symbol}</span>
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <span className="num rounded border border-[#1e293b] bg-[#0b0e14] px-1.5 py-0.5 text-[10px] text-slate-300">
                      {t.max_leverage ? `${t.max_leverage}x` : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <span
                      key={`${t.pair}-${tickUp ? "u" : tickDown ? "d" : "f"}-${t.last}`}
                      className={cn(
                        "num inline-block rounded px-1 text-[12px] text-slate-100",
                        tickUp && "animate-[flash-up_0.6s_ease-out] text-[#00c076]",
                        tickDown && "animate-[flash-down_0.6s_ease-out] text-[#ff455b]",
                      )}
                    >
                      {fmtPrice(t.last)}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <span
                      data-testid="row-change"
                      className={cn(
                        "num inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[12px] font-semibold",
                        up ? "bg-[#00c076]/12 text-[#00c076]" : "bg-[#ff455b]/12 text-[#ff455b]",
                      )}
                    >
                      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {fmtPct(t.change_pct)}
                    </span>
                  </td>
                  <td className="num px-3 py-1.5 text-right text-[12px] text-slate-400">{fmtPrice(t.high)}</td>
                  <td className="num px-3 py-1.5 text-right text-[12px] text-slate-400">{fmtPrice(t.low)}</td>
                  <td className="num px-3 py-1.5 text-right text-[12px] text-slate-400">{fmtCompact(t.volume)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-slate-500" data-testid="instrument-empty-state">
            {instruments.length === 0 ? "Waiting for the CoinDCX stream…" : "No instrument matches this filter."}
          </p>
        ) : null}
      </div>

      <div className="border-t border-[#1e293b] px-3 py-1.5 text-[10px] text-slate-500 num" data-testid="instrument-table-hint">
        Showing {rows.length} of {instruments.length} instruments — refine with search or filters
      </div>
    </div>
  );
}
