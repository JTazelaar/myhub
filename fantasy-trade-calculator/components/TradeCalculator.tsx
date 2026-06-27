"use client";

import { useMemo, useState } from "react";
import { compareTradeSides, type TradeComparison } from "@/lib/trades/value";

export type CalculatorPlayer = {
  id: number;
  name: string;
  position: string;
  team: string | null;
  value: number;
};

export function TradeCalculator({ players }: { players: CalculatorPlayer[] }) {
  const [sideAIds, setSideAIds] = useState<number[]>([]);
  const [sideBIds, setSideBIds] = useState<number[]>([]);

  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const sideAPlayers = sideAIds.map((id) => byId.get(id)).filter((p): p is CalculatorPlayer => Boolean(p));
  const sideBPlayers = sideBIds.map((id) => byId.get(id)).filter((p): p is CalculatorPlayer => Boolean(p));

  const result = compareTradeSides(
    sideAPlayers.map((p) => p.value),
    sideBPlayers.map((p) => p.value),
  );

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
        onAdd={(id) => addToSide("A", id)}
        onRemove={(id) => removeFromSide("A", id)}
      />
      <TradeSide
        label="Side B"
        players={sideBPlayers}
        allPlayers={players}
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
  onAdd,
  onRemove,
}: {
  label: string;
  players: CalculatorPlayer[];
  allPlayers: CalculatorPlayer[];
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{label}</h2>
      <select
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        value=""
        onChange={(e) => {
          const id = Number(e.target.value);
          if (id) onAdd(id);
        }}
      >
        <option value="">+ Add a player...</option>
        {allPlayers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.position}
            {p.team ? ` - ${p.team}` : ""}) - {p.value}
          </option>
        ))}
      </select>
      <ul className="flex flex-col gap-1">
        {players.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-md bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-900"
          >
            <span>
              {p.name} <span className="text-zinc-500">({p.value})</span>
            </span>
            <button
              type="button"
              onClick={() => onRemove(p.id)}
              className="-my-2 px-2 py-2 text-zinc-500 hover:text-red-600"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultBar({ result }: { result: TradeComparison }) {
  const aPct = Math.round(result.sideAShare * 100);
  const bPct = 100 - aPct;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="bg-blue-500" style={{ width: `${aPct}%` }} />
        <div className="bg-orange-500" style={{ width: `${bPct}%` }} />
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
