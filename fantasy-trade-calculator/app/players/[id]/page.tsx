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

function ValuePill({ value, label }: { value: number | undefined; label: string }) {
  if (value == null) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs text-white/20">—</span>
        <span className="text-[10px] text-white/20">{label}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-lg font-bold tabular-nums text-white/90">{value}</span>
      <span className="text-[10px] text-white/40">{label}</span>
    </div>
  );
}

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ format?: string }>;
}) {
  const { id } = await params;
  const { format: rawFormat } = await searchParams;
  const playerId = parseInt(id);
  if (isNaN(playerId)) notFound();

  const backFormatId = FORMAT_MAP.has(rawFormat ?? "") ? (rawFormat as string) : DEFAULT_FORMAT_ID;

  const [player, snapshot] = await Promise.all([
    prisma.player.findUnique({ where: { id: playerId } }).catch(() => null),
    getLatestSnapshot().catch(() => null),
  ]);

  if (!player) notFound();

  const values = snapshot
    ? await prisma.playerValue
        .findMany({
          where: { playerId, snapshotId: snapshot.id },
          orderBy: [{ format: "asc" }, { source: "asc" }],
        })
        .catch(() => [])
    : [];

  // Build: formatId → source → value
  const byFormat = new Map<string, Map<string, number>>();
  for (const v of values) {
    if (!byFormat.has(v.format)) byFormat.set(v.format, new Map());
    byFormat.get(v.format)!.set(v.source, v.value);
  }

  // Determine which sources appear for this player
  const sourcesPresent = [...new Set(values.map((v) => v.source))].sort();

  // Formats where this player has at least one value
  const formatsWithData = FORMATS.filter((f) => byFormat.has(f.id));

  const backParams = new URLSearchParams();
  backParams.set("format", backFormatId);

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
        <TeamLogo team={player.team} size={48} className="flex-shrink-0" />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white">{player.name}</h1>
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-semibold"
              style={{ color: POSITION_COLORS[player.position] ?? "rgba(255,255,255,0.50)" }}
            >
              {player.position}
            </span>
            {player.team && (
              <span className="text-sm text-white/45">{player.team}</span>
            )}
          </div>
        </div>
      </div>

      {/* Values matrix */}
      {!snapshot || formatsWithData.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-10 text-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p className="text-sm text-white/40">No values available for this player yet.</p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(48px) saturate(200%)",
            WebkitBackdropFilter: "blur(48px) saturate(200%)",
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

      <p className="text-xs text-white/25">
        Values on 1–99 scale · {snapshot?.label ?? "No snapshot"}
      </p>
    </div>
  );
}
