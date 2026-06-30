"use client";

import { useMemo, useRef, useState } from "react";
import { compareTradeSides, type TradeComparison } from "@/lib/trades/value";

export type CalculatorPlayer = {
  id: number;
  name: string;
  position: string;
  team: string | null;
  value: number;
};

const ESPN_ABBR: Record<string, string> = {
  ARI: "ari", ATL: "atl", BAL: "bal", BUF: "buf", CAR: "car",
  CHI: "chi", CIN: "cin", CLE: "cle", DAL: "dal", DEN: "den",
  DET: "det", GB:  "gb",  HOU: "hou", IND: "ind", JAX: "jac",
  KC:  "kc",  LAC: "lac", LAR: "lar", LV:  "lvr", MIA: "mia",
  MIN: "min", NE:  "ne",  NO:  "no",  NYG: "nyg", NYJ: "nyj",
  PHI: "phi", PIT: "pit", SEA: "sea", SF:  "sf",  TB:  "tb",
  TEN: "ten", WAS: "wsh",
};

function TeamLogo({ team, size = 20 }: { team: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const abbr = team ? ESPN_ABBR[team] : null;
  if (!abbr || failed) return null;
  return (
    <img
      src={`https://a.espncdn.com/i/teamlogos/nfl/500/${abbr}.png`}
      alt={team!}
      width={size}
      height={size}
      className="shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

export function TradeCalculator({ players }: { players: CalculatorPlayer[] }) {
  const [sideAIds, setSideAIds] = useState<number[]>([]);
  const [sideBIds, setSideBIds] = useState<number[]>([]);

  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  const sideAPlayers = useMemo(
    () =>
      sideAIds
        .map((id) => byId.get(id))
        .filter((p): p is CalculatorPlayer => Boolean(p))
        .sort((a, b) => b.value - a.value),
    [sideAIds, byId],
  );

  const sideBPlayers = useMemo(
    () =>
      sideBIds
        .map((id) => byId.get(id))
        .filter((p): p is CalculatorPlayer => Boolean(p))
        .sort((a, b) => b.value - a.value),
    [sideBIds, byId],
  );

  const result = compareTradeSides(
    sideAPlayers.map((p) => p.value),
    sideBPlayers.map((p) => p.value),
  );

  const usedIds = useMemo(() => [...sideAIds, ...sideBIds], [sideAIds, sideBIds]);

  function addToSide(side: "A" | "B", id: number) {
    const setIds = side === "A" ? setSideAIds : setSideBIds;
    setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function removeFromSide(side: "A" | "B", id: number) {
    const setIds = side === "A" ? setSideAIds : setSideBIds;
    setIds((prev) => prev.filter((x) => x !== id));
  }

  const hasPlayers = sideAPlayers.length > 0 || sideBPlayers.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <TradeSide
        label="Side A"
        players={sideAPlayers}
        allPlayers={players}
        excludeIds={usedIds}
        onAdd={(id) => addToSide("A", id)}
        onRemove={(id) => removeFromSide("A", id)}
      />
      <TradeSide
        label="Side B"
        players={sideBPlayers}
        allPlayers={players}
        excludeIds={usedIds}
        onAdd={(id) => addToSide("B", id)}
        onRemove={(id) => removeFromSide("B", id)}
      />

      {hasPlayers && (
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <ResultBar result={result} />
        </div>
      )}
    </div>
  );
}

function TradeSide({
  label,
  players,
  allPlayers,
  excludeIds,
  onAdd,
  onRemove,
}: {
  label: string;
  players: CalculatorPlayer[];
  allPlayers: CalculatorPlayer[];
  excludeIds: number[];
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{label}</h2>
      <PlayerSearch allPlayers={allPlayers} excludeIds={excludeIds} onSelect={onAdd} />
      <ul className="flex flex-col gap-1">
        {players.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-2 rounded-md bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-800"
          >
            <div className="flex min-w-0 items-center gap-2">
              <TeamLogo team={p.team} size={22} />
              <div className="flex min-w-0 flex-col">
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-zinc-500">
                  {p.position} · <span className="font-semibold">{p.value}</span>
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemove(p.id)}
              className="-my-2 shrink-0 px-2 py-2 text-zinc-400 hover:text-red-500"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlayerSearch({
  allPlayers,
  excludeIds,
  onSelect,
}: {
  allPlayers: CalculatorPlayer[];
  excludeIds: number[];
  onSelect: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allPlayers
      .filter((p) => !excludeIds.includes(p.id) && p.name.toLowerCase().includes(q))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [query, allPlayers, excludeIds]);

  function handleSelect(id: number) {
    onSelect(id);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search players..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900"
        />
        {query ? (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery("");
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lg leading-none text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Clear"
          >
            ×
          </button>
        ) : (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </div>

      {showDropdown && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {results.length > 0 ? (
            results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(p.id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
                >
                  <TeamLogo team={p.team} size={20} />
                  <span className="min-w-0 flex-1 font-medium">{p.name}</span>
                  <span className="shrink-0 text-xs text-zinc-400">
                    {p.position}{" "}
                    <span className="font-semibold text-zinc-600 dark:text-zinc-300">{p.value}</span>
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-3 text-sm text-zinc-400">No players found</li>
          )}
        </ul>
      )}
    </div>
  );
}

function ResultBar({ result }: { result: TradeComparison }) {
  const aPct = Math.round(result.sideAShare * 100);
  const bPct = 100 - aPct;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="bg-blue-500 transition-all" style={{ width: `${aPct}%` }} />
        <div className="bg-orange-500 transition-all" style={{ width: `${bPct}%` }} />
      </div>
      <p className="text-sm">
        {result.winner === "tie"
          ? "Even trade."
          : `Side ${result.winner} wins the trade (${result.winner === "A" ? aPct : bPct}% vs ${
              result.winner === "A" ? bPct : aPct
            }%).`}
      </p>
    </div>
  );
}
