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
      className="shrink-0 object-contain opacity-90"
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
    <div className="flex flex-col gap-4">
      {/* Two side panels — side by side on md+, stacked on mobile */}
      <div className="flex flex-col gap-4 md:flex-row">
        <TradeSide
          label="Side A"
          accentColor="rgba(59,130,246,0.20)"
          accentBorder="rgba(59,130,246,0.28)"
          players={sideAPlayers}
          allPlayers={players}
          excludeIds={usedIds}
          onAdd={(id) => addToSide("A", id)}
          onRemove={(id) => removeFromSide("A", id)}
        />
        <TradeSide
          label="Side B"
          accentColor="rgba(249,115,22,0.18)"
          accentBorder="rgba(249,115,22,0.26)"
          players={sideBPlayers}
          allPlayers={players}
          excludeIds={usedIds}
          onAdd={(id) => addToSide("B", id)}
          onRemove={(id) => removeFromSide("B", id)}
        />
      </div>

      {/* Result bar */}
      {hasPlayers && (
        <div
          className="rounded-2xl px-5 py-4"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
          }}
        >
          <ResultBar result={result} />
        </div>
      )}
    </div>
  );
}

function TradeSide({
  label,
  accentColor,
  accentBorder,
  players,
  allPlayers,
  excludeIds,
  onAdd,
  onRemove,
}: {
  label: string;
  accentColor: string;
  accentBorder: string;
  players: CalculatorPlayer[];
  allPlayers: CalculatorPlayer[];
  excludeIds: number[];
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div
      className="flex flex-1 flex-col gap-3 rounded-2xl p-4"
      style={{
        background: accentColor,
        border: `1px solid ${accentBorder}`,
        backdropFilter: "blur(48px) saturate(200%)",
        WebkitBackdropFilter: "blur(48px) saturate(200%)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.14)",
      }}
    >
      <span className="text-xs font-bold uppercase tracking-widest text-white/50">{label}</span>
      <PlayerSearch allPlayers={allPlayers} excludeIds={excludeIds} onSelect={onAdd} />
      <ul className="flex flex-col gap-1.5">
        {players.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <TeamLogo team={p.team} size={22} />
              <div className="flex min-w-0 flex-col">
                <span className="font-semibold text-white/90">{p.name}</span>
                <span className="text-xs text-white/45">
                  {p.position} ·{" "}
                  <span className="font-bold text-white/65">{p.value}</span>
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemove(p.id)}
              className="-my-2 shrink-0 rounded-full px-2 py-2 text-white/30 transition-colors hover:text-red-400"
              aria-label="Remove"
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
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search players…"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="glass-input w-full rounded-xl px-3 py-2.5 pr-9 text-sm"
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
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lg leading-none text-white/30 hover:text-white/70"
            aria-label="Clear"
          >
            ×
          </button>
        ) : (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </div>

      {showDropdown && (
        <ul
          className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-2xl py-1"
          style={{
            background: "rgba(10, 12, 28, 0.88)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(48px) saturate(200%)",
            WebkitBackdropFilter: "blur(48px) saturate(200%)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          }}
        >
          {results.length > 0 ? (
            results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(p.id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/8"
                >
                  <TeamLogo team={p.team} size={20} />
                  <span className="min-w-0 flex-1 font-medium text-white/85">{p.name}</span>
                  <span className="shrink-0 text-xs text-white/40">
                    {p.position}{" "}
                    <span className="font-bold text-white/65">{p.value}</span>
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-3 text-sm text-white/35">No players found</li>
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
    <div className="flex flex-col gap-3">
      {/* Bar */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${aPct}%`,
            background: "linear-gradient(90deg, rgba(59,130,246,0.9) 0%, rgba(99,102,241,0.9) 100%)",
            boxShadow: "0 0 12px rgba(59,130,246,0.6)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 rounded-full transition-all duration-500"
          style={{
            width: `${bPct}%`,
            background: "linear-gradient(90deg, rgba(251,146,60,0.9) 0%, rgba(249,115,22,0.9) 100%)",
            boxShadow: "0 0 12px rgba(249,115,22,0.5)",
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs font-medium">
        <span className="text-blue-300">{aPct}% Side A</span>
        <span className="text-white/50 text-center">
          {result.winner === "tie"
            ? "Even trade"
            : `Side ${result.winner} wins`}
        </span>
        <span className="text-orange-300">{bPct}% Side B</span>
      </div>
    </div>
  );
}
