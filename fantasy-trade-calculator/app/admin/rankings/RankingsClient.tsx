"use client";

import { useState } from "react";

const SOURCE_LABELS: Record<string, string> = {
  fantasycalc: "FantasyCalc",
  keeptradecut: "KeepTradeCut",
};

function sourceLabel(source: string) {
  return SOURCE_LABELS[source] ?? source;
}

type Row = {
  playerId: number;
  name: string;
  position: string;
  team: string | null;
  bySource: Record<string, number>;
  rankBySource: Record<string, number>;
  consensus: number | null;
};

const POSITIONS = ["All", "QB", "RB", "WR", "TE"];

export function RankingsClient({
  rows,
  sources,
}: {
  rows: Row[];
  sources: string[];
}) {
  const [position, setPosition] = useState("All");

  const filtered =
    position === "All" ? rows : rows.filter((r) => r.position === position);

  return (
    <div className="flex flex-col gap-4">
      {/* Position filter tabs */}
      <div className="flex gap-1">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            onClick={() => setPosition(pos)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              position === pos
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-300">
                Player
              </th>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-300">
                Pos
              </th>
              {sources.map((src) => (
                <th
                  key={src}
                  className="px-4 py-3 text-right font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  {sourceLabel(src)}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold text-zinc-700 dark:text-zinc-300">
                Consensus
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={sources.length + 3}
                  className="px-4 py-8 text-center text-zinc-500"
                >
                  No data yet — run an import to populate rankings.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.playerId}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                >
                  <td className="px-4 py-2.5">
                    <span className="font-medium">{row.name}</span>
                    {row.team && (
                      <span className="ml-1.5 text-xs text-zinc-400">{row.team}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-500">{row.position}</td>
                  {sources.map((src) => (
                    <SourceCell
                      key={src}
                      value={row.bySource[src] ?? null}
                      rank={row.rankBySource[src] ?? null}
                      consensus={row.consensus}
                    />
                  ))}
                  <td className="px-4 py-2.5 text-right">
                    {row.consensus != null ? (
                      <span className="font-semibold tabular-nums">{row.consensus}</span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-400">
        {filtered.length} player{filtered.length !== 1 ? "s" : ""} · Values on 1–99 scale ·
        Green = source rates higher than consensus · Amber = source rates lower
      </p>
    </div>
  );
}

function SourceCell({
  value,
  rank,
  consensus,
}: {
  value: number | null;
  rank: number | null;
  consensus: number | null;
}) {
  if (value == null || rank == null) {
    return (
      <td className="px-4 py-2.5 text-right text-zinc-300 dark:text-zinc-600">—</td>
    );
  }

  const diff = consensus != null ? value - consensus : 0;
  const cellColor =
    diff >= 10
      ? "text-green-700 dark:text-green-400"
      : diff <= -10
        ? "text-amber-600 dark:text-amber-400"
        : "text-zinc-700 dark:text-zinc-300";

  return (
    <td className="px-4 py-2.5 text-right">
      <span className={`tabular-nums ${cellColor}`}>
        <span className="text-xs font-normal opacity-60">#{rank} </span>
        <span className="font-semibold">{value}</span>
      </span>
    </td>
  );
}
