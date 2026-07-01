import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getLatestSnapshot } from "@/lib/rankings/snapshots";
import { FORMATS, FORMAT_MAP, DEFAULT_FORMAT_ID } from "@/lib/formats";
import { TeamLogo } from "@/components/TeamLogo";

export const dynamic = "force-dynamic";

const POSITION_COLORS: Record<string, string> = {
  QB: "rgba(96,165,250,0.90)",
  RB: "rgba(52,211,153,0.90)",
  WR: "rgba(167,139,250,0.90)",
  TE: "rgba(251,146,60,0.90)",
};

const SOURCE_LABELS: Record<string, string> = {
  fantasycalc: "FantasyCalc",
  keeptradecut: "KeepTradeCut",
  manual: "Manual",
};

const SCORING_OPTIONS = [
  { id: "std", label: "Standard", field: "ptsStd" as const },
  { id: "halfppr", label: "½ PPR", field: "ptsHalfPpr" as const },
  { id: "ppr", label: "Full PPR", field: "ptsPpr" as const },
];

type WeeklyStats = {
  id: number;
  season: number;
  week: number;
  seasonType: string;
  ptsStd: number | null;
  ptsHalfPpr: number | null;
  ptsPpr: number | null;
  passYd: number | null;
  passTd: number | null;
  passInt: number | null;
  rushYd: number | null;
  rushTd: number | null;
  rec: number | null;
  recYd: number | null;
  recTd: number | null;
  locked: boolean;
};

function weekLabel(stats: WeeklyStats): string {
  if (stats.seasonType === "pre") return `Pre ${stats.week}`;
  return `W${stats.week}`;
}

function fmt(v: number | null, decimals = 0): string {
  if (v == null) return "—";
  return decimals > 0 ? v.toFixed(decimals) : String(v);
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <td className="px-4 py-2 text-xs text-white/40">{label}</td>
      <td className="px-4 py-2 text-right text-sm font-semibold tabular-nums text-white/85">
        {value}
      </td>
    </tr>
  );
}

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ format?: string; week?: string; stype?: string; scoring?: string }>;
}) {
  const { id } = await params;
  const { format: rawFormat, week: rawWeek, stype = "regular", scoring = "halfppr" } =
    await searchParams;
  const playerId = parseInt(id);
  if (isNaN(playerId)) notFound();

  const backFormatId = FORMAT_MAP.has(rawFormat ?? "") ? (rawFormat as string) : DEFAULT_FORMAT_ID;

  const [player, snapshot] = await Promise.all([
    prisma.player.findUnique({ where: { id: playerId } }).catch(() => null),
    getLatestSnapshot().catch(() => null),
  ]);

  if (!player) notFound();

  // Trade values
  const values = snapshot
    ? await prisma.playerValue
        .findMany({
          where: { playerId, snapshotId: snapshot.id },
          orderBy: [{ format: "asc" }, { source: "asc" }],
        })
        .catch(() => [])
    : [];

  // Weekly stats — all weeks for this player, sorted newest first
  const allWeeklyStats: WeeklyStats[] = await prisma.playerWeeklyStats
    .findMany({
      where: { playerId },
      orderBy: [{ season: "desc" }, { seasonType: "asc" }, { week: "asc" }],
    })
    .catch(() => []);

  // Which week is selected
  const selectedWeek = rawWeek ? parseInt(rawWeek) : (allWeeklyStats[allWeeklyStats.length - 1]?.week ?? null);
  const selectedStype = stype;
  const activeStats = allWeeklyStats.find(
    (s) => s.week === selectedWeek && s.seasonType === selectedStype,
  ) ?? null;

  // Trade value matrix
  const byFormat = new Map<string, Map<string, number>>();
  for (const v of values) {
    if (!byFormat.has(v.format)) byFormat.set(v.format, new Map());
    byFormat.get(v.format)!.set(v.source, v.value);
  }
  const sourcesPresent = [...new Set(values.map((v) => v.source))].sort();
  const formatsWithData = FORMATS.filter((f) => byFormat.has(f.id));

  const backParams = new URLSearchParams();
  backParams.set("format", backFormatId);

  // Scoring field for the selected scoring type
  const scoringField = SCORING_OPTIONS.find((s) => s.id === scoring)?.field ?? "ptsHalfPpr";

  function weekLink(w: number, st: string) {
    const p = new URLSearchParams();
    p.set("format", backFormatId);
    p.set("week", String(w));
    p.set("stype", st);
    p.set("scoring", scoring);
    return `/players/${playerId}?${p.toString()}`;
  }

  function scoringLink(sc: string) {
    const p = new URLSearchParams();
    p.set("format", backFormatId);
    if (selectedWeek) p.set("week", String(selectedWeek));
    p.set("stype", selectedStype);
    p.set("scoring", sc);
    return `/players/${playerId}?${p.toString()}`;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      {/* Back link */}
      <Link
        href={`/?${backParams.toString()}`}
        className="self-start text-sm text-white/40 transition-colors hover:text-white/70"
      >
        ← Rankings
      </Link>

      {/* Player header */}
      <div
        className="flex items-center gap-4 rounded-2xl p-5"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
          backdropFilter: "blur(48px) saturate(200%)",
          WebkitBackdropFilter: "blur(48px) saturate(200%)",
        }}
      >
        <TeamLogo team={player.team} size={52} className="flex-shrink-0" />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white">{player.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-sm font-semibold"
              style={{ color: POSITION_COLORS[player.position] ?? "rgba(255,255,255,0.50)" }}
            >
              {player.position}
            </span>
            {player.team && <span className="text-sm text-white/45">{player.team}</span>}
            {player.college && (
              <span className="text-xs text-white/30">{player.college}</span>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
          Weekly Stats
        </h2>

        {allWeeklyStats.length === 0 ? (
          <div
            className="rounded-2xl px-5 py-8 text-center"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p className="text-sm text-white/30">
              No weekly stats yet.
            </p>
            <p className="mt-1 text-xs text-white/20">
              Run{" "}
              <code
                className="rounded px-1 py-0.5 font-mono"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                npm run import:weekly-stats
              </code>{" "}
              after each week.
            </p>
          </div>
        ) : (
          <>
            {/* Week selector tabs */}
            <div className="flex flex-wrap gap-1.5">
              {allWeeklyStats.map((s) => {
                const isActive = s.week === selectedWeek && s.seasonType === selectedStype;
                return (
                  <Link
                    key={`${s.seasonType}-${s.week}`}
                    href={weekLink(s.week, s.seasonType)}
                    className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                    style={
                      isActive
                        ? {
                            background: "rgba(255,255,255,0.16)",
                            border: "1px solid rgba(255,255,255,0.22)",
                            color: "rgba(255,255,255,0.92)",
                          }
                        : {
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.40)",
                          }
                    }
                  >
                    {weekLabel(s)}
                    {s.locked && (
                      <span className="ml-1 text-[9px] text-white/25">✓</span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Scoring selector */}
            <div className="flex gap-1.5">
              {SCORING_OPTIONS.map((opt) => (
                <Link
                  key={opt.id}
                  href={scoringLink(opt.id)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                  style={
                    scoring === opt.id
                      ? {
                          background: "rgba(255,255,255,0.12)",
                          border: "1px solid rgba(255,255,255,0.18)",
                          color: "rgba(255,255,255,0.85)",
                        }
                      : {
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.07)",
                          color: "rgba(255,255,255,0.35)",
                        }
                  }
                >
                  {opt.label}
                </Link>
              ))}
            </div>

            {/* Stats for selected week */}
            {activeStats ? (
              <div
                className="overflow-hidden rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              >
                {/* Points hero */}
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <span className="text-sm text-white/50">Fantasy Points</span>
                  <span className="text-3xl font-bold tabular-nums text-white">
                    {fmt(activeStats[scoringField], 1)}
                  </span>
                </div>

                <table className="w-full">
                  <tbody>
                    {/* QB stats */}
                    {(activeStats.passYd != null || activeStats.passTd != null) && (
                      <>
                        <StatRow label="Pass Yards" value={fmt(activeStats.passYd)} />
                        <StatRow label="Pass TD" value={fmt(activeStats.passTd)} />
                        <StatRow label="INT" value={fmt(activeStats.passInt)} />
                      </>
                    )}
                    {/* Rush stats */}
                    {(activeStats.rushYd != null || activeStats.rushTd != null) && (
                      <>
                        <StatRow label="Rush Yards" value={fmt(activeStats.rushYd)} />
                        <StatRow label="Rush TD" value={fmt(activeStats.rushTd)} />
                      </>
                    )}
                    {/* Receiving stats */}
                    {(activeStats.rec != null || activeStats.recYd != null) && (
                      <>
                        <StatRow label="Receptions" value={fmt(activeStats.rec)} />
                        <StatRow label="Rec Yards" value={fmt(activeStats.recYd)} />
                        <StatRow label="Rec TD" value={fmt(activeStats.recTd)} />
                      </>
                    )}
                  </tbody>
                </table>

                {activeStats.locked && (
                  <p className="px-5 py-2 text-xs text-white/20">
                    {weekLabel(activeStats)} {activeStats.season} · Final
                  </p>
                )}
              </div>
            ) : (
              <div
                className="rounded-2xl px-5 py-8 text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <p className="text-sm text-white/30">No stats for this week.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Trade Values matrix */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
          Trade Values
        </h2>
        {!snapshot || formatsWithData.length === 0 ? (
          <div
            className="rounded-2xl px-6 py-8 text-center"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p className="text-sm text-white/40">No values available yet.</p>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/30">
                    Format
                  </th>
                  {sourcesPresent.map((src) => (
                    <th
                      key={src}
                      className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/30"
                    >
                      {SOURCE_LABELS[src] ?? src}
                    </th>
                  ))}
                  {sourcesPresent.length > 1 && (
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/30">
                      Avg
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {formatsWithData.map((f, i) => {
                  const srcMap = byFormat.get(f.id)!;
                  const vals = sourcesPresent
                    .map((s) => srcMap.get(s))
                    .filter((v): v is number => v != null);
                  const avg =
                    vals.length > 1
                      ? Math.round(vals.reduce((a, b) => a + b) / vals.length)
                      : null;
                  return (
                    <tr
                      key={f.id}
                      style={
                        i !== formatsWithData.length - 1
                          ? { borderBottom: "1px solid rgba(255,255,255,0.05)" }
                          : {}
                      }
                    >
                      <td className="px-4 py-3 text-xs text-white/60">{f.label}</td>
                      {sourcesPresent.map((src) => {
                        const val = srcMap.get(src);
                        return (
                          <td key={src} className="px-4 py-3 text-center">
                            {val != null ? (
                              <span className="tabular-nums font-semibold text-white/85">{val}</span>
                            ) : (
                              <span className="text-white/20">—</span>
                            )}
                          </td>
                        );
                      })}
                      {sourcesPresent.length > 1 && (
                        <td className="px-4 py-3 text-center">
                          {avg != null ? (
                            <span className="tabular-nums font-bold text-white/90">{avg}</span>
                          ) : (
                            <span className="text-white/20">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-white/25">
        Trade values on 1–99 scale · {snapshot?.label ?? "No snapshot"}
      </p>
    </div>
  );
}
