import { Pencil, Power } from "lucide-react";
import { STATUS_STYLE } from "@/lib/botTypes";
import type { Strategy } from "@/lib/botTypes";
import { cn } from "@/lib/utils";

export default function StrategyList({
  strategies,
  selectedId,
  onSelect,
  onToggleEnabled,
  onEdit,
}: {
  strategies: Strategy[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleEnabled: (strategy: Strategy) => void;
  onEdit: (strategy: Strategy) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#1e293b] bg-[#0d111a]">
      <div className="flex items-center justify-between border-b border-[#1e293b] px-3 py-2.5">
        <h2 className="font-heading text-sm font-semibold text-slate-100">Strategies</h2>
        <span className="num text-[11px] text-slate-500" data-testid="strategy-count">
          {strategies.length} configured
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {strategies.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-slate-500" data-testid="strategy-empty-state">
            No strategies yet — use “Add Strategy” to create one.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {strategies.map((s, index) => {
              const style = STATUS_STYLE[s.status];
              const selected = s.id === selectedId;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    data-testid="strategy-card"
                    data-strategy-id={s.id}
                    data-selected={selected}
                    onClick={() => onSelect(s.id)}
                    className={cn(
                      "w-full rounded-md border px-2.5 py-2 text-left transition-colors duration-150",
                      selected
                        ? "border-[#00c076]/50 bg-[#00c076]/[0.06]"
                        : "border-[#1e293b] bg-[#111724] hover:border-slate-600",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="num text-[10px] font-semibold text-[#7f9bff]">{index + 1}.</span>
                      <span className="font-heading text-[13px] font-semibold text-slate-100" data-testid="strategy-name">
                        {s.name}
                      </span>
                      <span
                        role="switch"
                        aria-checked={s.enabled}
                        tabIndex={0}
                        data-testid="strategy-enable-toggle"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleEnabled(s);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            onToggleEnabled(s);
                          }
                        }}
                        className={cn(
                          "ml-auto inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors duration-150",
                          s.enabled
                            ? "bg-[#00c076]/12 text-[#00c076]"
                            : "bg-slate-500/12 text-slate-400 hover:text-slate-200",
                        )}
                      >
                        <Power className="h-3 w-3" />
                        {s.enabled ? "ARMED" : "OFF"}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`Edit ${s.name}`}
                        title="Edit strategy"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(s);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            onEdit(s);
                          }
                        }}
                        className="ml-auto inline-flex cursor-pointer rounded p-1 text-slate-400 hover:bg-slate-700/40 hover:text-white"
                      >
                        <Pencil className="h-3 w-3" />
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span data-testid="strategy-status" className={cn("num rounded px-1.5 py-0.5 text-[9px] font-semibold", style.className)}>{style.label}</span>
                      <span className="num rounded bg-[#1e293b] px-1.5 py-0.5 text-[9px] text-slate-300" data-testid="strategy-timeframe">{s.timeframe}</span>
                      <span className="num rounded bg-[#1e293b] px-1.5 py-0.5 text-[9px] text-slate-300">{s.leverage}x</span>
                      <span className="num rounded bg-[#1e293b] px-1.5 py-0.5 text-[9px] text-slate-300">TP {s.tp_pct}%</span>
                      <span className="num rounded bg-[#1e293b] px-1.5 py-0.5 text-[9px] text-slate-300">SL {s.sl_pct ?? "—"}%</span>
                    </div>

                    <p className="mt-1 text-[11px] leading-snug text-slate-400" data-testid="strategy-detail">
                      {s.detail}
                    </p>

                    <div className="num mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1 text-[9px] text-slate-500">
                      <span>{s.coin_pick === "top_loser" ? "top loser" : "top gainer"}</span>
                      <span>₹{s.capital_cap_inr.toLocaleString("en-IN")}</span>
                      <span data-testid="strategy-trades-today">{s.trades_today}/{s.max_trades_per_day} today</span>
                      {s.next_slot_ist ? <span>next {s.next_slot_ist}</span> : null}
                    </div>

                    {s.open_pair ? (
                      <div className="mt-1.5 rounded border border-[#1e293b] bg-[#0b0e14] px-1.5 py-1 text-[9px] text-slate-300">
                        <span className={s.open_side === "buy" ? "text-[#00c076]" : "text-[#ff455b]"}>
                          {s.open_side === "buy" ? "LONG" : "SHORT"} {s.open_pair}
                        </span>{" "}
                        <span className="num text-slate-400">@ {s.entry_price?.toFixed(4)} → TP {s.tp_price?.toFixed(4)}</span>
                        {s.sl_price ? <span className="num text-slate-400"> / SL {s.sl_price.toFixed(4)}</span> : null}
                      </div>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
