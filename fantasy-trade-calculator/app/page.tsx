import Link from "next/link";
import { Suspense } from "react";
import { FormatPicker } from "@/components/FormatPicker";
import { getLatestRankings, getLatestSnapshot } from "@/lib/rankings/snapshots";
import { FORMATS, FORMAT_MAP, DEFAULT_FORMAT_ID } from "@/lib/formats";

export const dynamic = "force-dynamic";

const POSITIONS = ["All", "QB", "RB", "WR", "TE"];

const POSITION_COLORS: Record<string, string> = {
  QB: "rgba(96,165,250,0.90)",   // blue
  RB: "rgba(52,211,153,0.90)",   // emerald
  WR: "rgba(167,139,250,0.90)",  // violet
  TE: "rgba(251,146,60,0.90)",   // orange
};

function ValueBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 rounded-full"
        style={{
          width: `${value}%`,
          maxWidth: "6rem",
          background: "linear-gradient(90deg, rgba(96,165,250,0.6) 0%, rgba(167,139,250,0.8) 100%)",
          boxShadow: "0 0 6px rgba(139,92,246,0.35)",
        }}
      />
      <span className="tabular-nums text-sm font-bold text-white/85">{value}</span>
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ format?: string; pos?: string }>;
}) {
  const { format: rawFormat, pos = "All" } = await searchParams;
  const formatId = FORMAT_MAP.has(rawFormat ?? "") ? (rawFormat as string) : DEFAULT_FORMAT_ID;
  const format = FORMAT_MAP.get(formatId)!;

  const [snapshot, rankings] = await Promise.all([
    getLatestSnapshot().catch(() => null),
    getLatestRankings(formatId).catch(() => [] as Awaited<ReturnType<typeof getLatestRankings>>),
  ]);

  const filtered = pos === "All" ? rankings : rankings.filter((r) => r.player.position === pos);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* Compact hero */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white">
          Fantasy Rankings
        </h1>
        <p className="text-sm text-white/45">
          Market-consensus values from FantasyCalc · updated daily
        </p>
      </div>

      {/* Format selector */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Suspense fallback={<div className="h-14" />}>
          <FormatPicker formatId={formatId} />
        </Suspense>
      </div>

      {/* Rankings table */}
      {!snapshot ? (
        <div
          className="rounded-2xl px-6 py-12 text-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p className="text-sm text-white/40">
            No rankings yet — check back after the first import runs.
          </p>
          <p className="mt-2 text-xs text-white/25">
            Imports run daily at 7 AM UTC.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Position filter */}
          <div className="flex gap-1.5">
            {POSITIONS.map((p) => {
              const params = new URLSearchParams();
              params.set("format", formatId);
              if (p !== "All") params.set("pos", p);
              return (
                <Link
                  key={p}
                  href={`/?${params.toString()}`}
                  className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-all"
                  style={
                    pos === p
                      ? {
                          background: "rgba(255,255,255,0.16)",
                          border: "1px solid rgba(255,255,255,0.22)",
                          color: "rgba(255,255,255,0.92)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
                        }
                      : {
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.40)",
                        }
                  }
                >
                  {p}
                </Link>
              );
            })}

            <span className="ml-auto flex items-center text-xs text-white/30">
              {format.label}
            </span>
          </div>

          {/* Table */}
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              backdropFilter: "blur(48px) saturate(200%)",
              WebkitBackdropFilter: "blur(48px) saturate(200%)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
            }}
          >
            {filtered.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-white/35">
                No players found for this filter.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <th className="w-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/30">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/30">
                      Player
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/30">
                      Pos
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/30">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr
                      key={row.player.id}
                      className="transition-colors hover:bg-white/[0.03]"
                      style={
                        i !== filtered.length - 1
                          ? { borderBottom: "1px solid rgba(255,255,255,0.05)" }
                          : {}
                      }
                    >
                      <td className="px-4 py-2.5 text-xs tabular-nums text-white/25">
                        {row.rank}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-white/88">{row.player.name}</span>
                        {row.player.team && (
                          <span className="ml-1.5 text-xs text-white/35">{row.player.team}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: POSITION_COLORS[row.player.position] ?? "rgba(255,255,255,0.50)" }}
                        >
                          {row.player.position}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end">
                          <ValueBar value={row.value} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p className="text-xs text-white/25">
            {filtered.length} player{filtered.length !== 1 ? "s" : ""} ·{" "}
            {snapshot.label} · Values on 1–99 scale
          </p>
        </div>
      )}

      {/* CTAs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Link
          href="/calculator"
          className="flex flex-col items-center gap-1.5 rounded-2xl px-4 py-4 text-center transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "rgba(59,130,246,0.14)",
            border: "1px solid rgba(59,130,246,0.28)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            boxShadow: "0 8px 24px rgba(59,130,246,0.16)",
          }}
        >
          <span className="text-2xl">📊</span>
          <span className="text-sm font-semibold text-white">Trade Calculator</span>
        </Link>

        <Link
          href="/vote"
          className="flex flex-col items-center gap-1.5 rounded-2xl px-4 py-4 text-center transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "rgba(139,92,246,0.14)",
            border: "1px solid rgba(139,92,246,0.26)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            boxShadow: "0 8px 24px rgba(139,92,246,0.14)",
          }}
        >
          <span className="text-2xl">⚡</span>
          <span className="text-sm font-semibold text-white">Player Vote</span>
        </Link>

        <Link
          href="/admin"
          className="col-span-2 flex flex-col items-center gap-1.5 rounded-2xl px-4 py-4 text-center transition-all hover:scale-[1.02] active:scale-[0.98] sm:col-span-1"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
          }}
        >
          <span className="text-2xl">⚙️</span>
          <span className="text-sm font-semibold text-white/60">Admin</span>
        </Link>
      </div>
    </div>
  );
}
