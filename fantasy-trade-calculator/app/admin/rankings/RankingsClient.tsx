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
      {/* Position filter pills */}
      <div className="flex gap-1.5">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            onClick={() => setPosition(pos)}
            className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-all"
            style={
              position === pos
                ? {
                    background: "rgba(255,255,255,0.16)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    color: "rgba(255,255,255,0.92)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
                  }
                : {
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.42)",
                  }
            }
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Comparison table */}
      <div
        className="overflow-x-auto rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
          backdropFilter: "blur(48px) saturate(200%)",
          WebkitBackdropFilter: "blur(48px) saturate(200%)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
        }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <th
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40"
              >
                Player
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                Pos
              </th>
              {sources.map((src) => (
                <th
                  key={src}
                  className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/40"
                >
                  {sourceLabel(src)}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/40">
                Consensus
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={sources.length + 3}
                  className="px-4 py-10 text-center text-sm text-white/35"
                >
                  No data yet — run an import to populate rankings.
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={row.playerId}
                  className="transition-colors hover:bg-white/[0.03]"
                  style={i !== filtered.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.05)" } : {}}
                >
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-white/88">{row.name}</span>
                    {row.team && (
                      <span className="ml-1.5 text-xs text-white/35">{row.team}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-medium text-white/40">{row.position}</td>
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
                      <span className="font-bold tabular-nums text-white/85">{row.consensus}</span>
                    ) : (
                      <span className="text-white/25">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-white/30">
        {filtered.length} player{filtered.length !== 1 ? "s" : ""} · Values on 1–99 scale ·{" "}
        <span className="text-emerald-400/70">Green</span> = source rates higher than consensus ·{" "}
        <span className="text-amber-400/70">Amber</span> = source rates lower
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
    return <td className="px-4 py-2.5 text-right text-white/20">—</td>;
  }

  const diff = consensus != null ? value - consensus : 0;
  const color =
    diff >= 10
      ? "rgba(52, 211, 153, 0.90)"
      : diff <= -10
        ? "rgba(251, 191, 36, 0.85)"
        : "rgba(255, 255, 255, 0.80)";

  return (
    <td className="px-4 py-2.5 text-right">
      <span className="tabular-nums" style={{ color }}>
        <span className="text-xs font-normal opacity-55">#{rank} </span>
        <span className="font-bold">{value}</span>
      </span>
    </td>
  );
}