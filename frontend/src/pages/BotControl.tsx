import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bot, History, LineChart, Power, Radar, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import AddStrategyDialog from "@/components/bot/AddStrategyDialog";
import ApiKeysDialog from "@/components/bot/ApiKeysDialog";
import LogConsole from "@/components/bot/LogConsole";
import StrategyList from "@/components/bot/StrategyList";
import { Button, buttonVariants } from "@/components/ui/button";
import { apiDelete, apiPost } from "@/lib/api";
import type { Strategy, StrategyCreate } from "@/lib/botTypes";
import { useBotStream } from "@/hooks/useBotStream";
import { cn } from "@/lib/utils";

export default function BotControl() {
  const { state, logs, connection } = useBotStream();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const queryClient = useQueryClient();

  const strategies = state?.strategies ?? [];
  const selected = strategies.find((s) => s.id === selectedId) ?? null;
  const botOn = state?.bot_on ?? false;
  const live = state?.execution_mode === "LIVE";

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["bot-state"] });

  const toggleBot = useMutation({
    mutationFn: (on: boolean) => apiPost("/bot/toggle", { on }),
    onSuccess: (_d, on) => {
      toast.success(on ? "Bot switched ON" : "Bot switched OFF");
      refresh();
    },
    onError: () => toast.error("Could not switch the bot"),
  });

  const create = useMutation({
    mutationFn: (body: StrategyCreate) => apiPost<Strategy>("/bot/strategies", body),
    onSuccess: (s) => {
      setSelectedId(s.id);
      toast.success(`Strategy “${s.name}” created`);
      refresh();
    },
    onError: () => toast.error("Could not create the strategy"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/bot/strategies/${id}`),
    onSuccess: () => {
      setSelectedId(null);
      toast.success("Strategy deleted");
      refresh();
    },
    onError: () => toast.error("Could not delete the strategy"),
  });

  const setEnabled = useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      apiPost<Strategy>(`/bot/strategies/${id}/enabled`, { on }),
    onSuccess: (s) => {
      toast.success(`${s.name} ${s.enabled ? "armed" : "disabled"}`);
      refresh();
    },
    onError: () => toast.error("Could not change the strategy"),
  });



  return (
    <div className="terminal-shell flex h-screen flex-col overflow-hidden bg-[#0b0e14] text-slate-100">
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#1e293b] bg-[#0e131f]/95 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded bg-[#00c076]/15 text-[#00c076]">
            <Bot className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <h1 className="font-heading text-[13px] font-bold tracking-tight text-white">
              Bot Control Center
            </h1>
            <p className="num text-[10px] text-slate-500" data-testid="bot-window-label">
              {state?.trading_window ?? "05:30 → 03:40 IST · slots follow each strategy's timeframe"}
              {state ? ` · ${state.server_time_ist.slice(11, 19)} IST` : ""}
            </p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span
            data-testid="execution-mode-badge"
            className={cn(
              "num inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
              live
                ? "border-[#ff455b]/40 bg-[#ff455b]/10 text-[#ff455b]"
                : "border-amber-500/40 bg-amber-500/10 text-amber-400",
            )}
          >
            {live ? <AlertTriangle className="h-3 w-3" /> : null}
            {live ? "LIVE ORDERS" : "PAPER MODE"}
          </span>
          <span
            data-testid="bot-connection-badge"
            className={cn(
              "num rounded-full border px-2.5 py-1 text-[11px]",
              connection === "live"
                ? "border-[#00c076]/40 bg-[#00c076]/10 text-[#00c076]"
                : "border-[#ff455b]/40 bg-[#ff455b]/10 text-[#ff455b]",
            )}
          >
            {connection === "live" ? "stream connected" : "stream offline"}
          </span>

          <Button
            size="sm"
            data-testid="bot-power-button"
            variant={botOn ? "destructive" : "default"}
            disabled={toggleBot.isPending}
            onClick={() => toggleBot.mutate(!botOn)}
          >
            <Power className="mr-1 h-3.5 w-3.5" />
            {botOn ? "Bot is ON · switch off" : "Bot is OFF · switch on"}
          </Button>

          <AddStrategyDialog onCreate={(body) => create.mutate(body)} pending={create.isPending} />

          <Button
            size="sm"
            variant="outline"
            data-testid="delete-strategy-button"
            disabled={!selected || remove.isPending}
            onClick={() => selected && remove.mutate(selected.id)}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete Strategy
          </Button>

          <ApiKeysDialog />

          <Link
            to="/position"
            data-testid="position-link"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-slate-200")}
          >
            <Radar className="mr-1 h-3.5 w-3.5" /> Live Position
          </Link>

          <Link
            to="/history"
            data-testid="history-link"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-slate-200")}
          >
            <History className="mr-1 h-3.5 w-3.5" /> Trade History
          </Link>

          <Link
            to="/"
            data-testid="scanner-link"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-slate-300")}
          >
            <LineChart className="mr-1 h-3.5 w-3.5" /> Scanner
          </Link>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("scalp_admin_logged_in");
              window.location.assign("/login");
            }}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-slate-200")}
          >
            Logout
          </button>
        </div>
      </header>

      {!noticeDismissed ? (
        <div
          data-testid="paper-mode-notice"
          className={cn(
            "flex shrink-0 items-center gap-3 border-b px-4 py-1.5 text-[11px]",
            state?.credentials_configured
              ? "border-[#00c076]/20 bg-[#00c076]/[0.06] text-[#6ee7b7]"
              : "border-amber-500/20 bg-amber-500/[0.06] text-amber-300",
          )}
        >
          <span className="min-w-0 flex-1">
            {state?.credentials_configured ? (
              <>CoinDCX API keys configured — PAPER mode is active. Enable live trading from the <b>API Keys</b> button when ready.</>
            ) : (
              <>No CoinDCX API keys configured — every entry and exit is simulated (PAPER). Use the <b>API Keys</b> button to add your key and secret.</>
            )}
          </span>
          <button
            type="button"
            aria-label="Dismiss API key notice"
            data-testid="dismiss-paper-mode-notice"
            onClick={() => setNoticeDismissed(true)}
            className="shrink-0 rounded p-1 text-current/70 transition-colors hover:bg-black/10 hover:text-current"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 lg:grid-cols-12 lg:overflow-hidden">
        <section className="terminal-panel min-h-[45vh] lg:col-span-4 lg:min-h-0">
          <StrategyList
            strategies={strategies}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onToggleEnabled={(s) => setEnabled.mutate({ id: s.id, on: !s.enabled })}
          />
        </section>
        <section className="terminal-panel min-h-[45vh] lg:col-span-8 lg:min-h-0">
          <LogConsole logs={logs} strategies={strategies} />
        </section>
      </main>

      <footer
        data-testid="scanning-footer"
        className="num flex h-9 shrink-0 items-center justify-between border-t border-[#1e293b] bg-[#090c11] px-4 text-[11px] text-slate-400"
      >
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00c076] animate-[beacon_1.6s_ease-in-out_infinite]" />
          Scanning live from CoinDCX
        </span>
        <span className="text-slate-500">
          {botOn ? "Bot armed" : "Bot idle"} · {strategies.filter((s) => s.enabled).length} armed strategies
        </span>
      </footer>
    </div>
  );
}
