import Link from "next/link";
import { AdminNotice } from "@/components/AdminNotice";
import { TeamLogo } from "@/components/TeamLogo";
import { prisma } from "@/lib/db/prisma";
import { getLatestSnapshot } from "@/lib/rankings/snapshots";

export const dynamic = "force-dynamic";

const KTC_FORMATS = [
  { id: "ppr_1qb", label: "PPR · 1QB" },
  { id: "ppr_2qb", label: "PPR · Superflex" },
  { id: "teprem_ppr_1qb", label: "TE Prem · PPR · 1QB" },
];

const DEFAULT_KTC_FORMAT = "ppr_1qb";

const POSITION_COLORS: Record<string, string> = {
  QB: "rgba(96,165,250,0.90)",
  RB: "rgba(52,211,153,0.90)",
  WR: "rgba(167,139,250,0.90)",
  TE: "rgba(251,146,60,0.90)",
};

export default async function AdminKtcPage({
  searchParams,
}: {
  searchParams: Promise<{ format?: string }>;
}) {
  const { format: rawFormat } = await searchParams;
  const formatId =
    KTC_FORMATS.some((f) => f.id === rawFormat) ? (rawFormat as string) : DEFAULT_KTC_FORMAT;
  const formatLabel = KTC_FORMATS.find((f) => f.id === formatId)?.label ?? formatId;

  const snapshot = await getLatestSnapshot();

  const values = snapshot
    ? await prisma.playerValue
        .findMany({
          where: { source: "keeptradecut", snapshotId: snapshot.id, format: formatId },
          include: { player: { select: { id: true, name: true, position: true, team: true } } },
          orderBy: { value: "desc" },
        })
        .catch(() => [])
    : [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <AdminNotice />

      {/* Header + nav */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">KTC Rankings</h1>
          {snapshot && (
            <p className="mt-0.5 text-sm text-white/40">
              {snapshot.label} · Week {snapshot.week}, {snapshot.season}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {[
            { href: "/admin", label: "Players" },
            { href: "/admin/rankings", label: "Comparison" },
            { href: "/admin/import", label: "Import" },
            { href: "/admin/snapshots", label: "Snapshots" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-white/55 transition-colors hover:bg-white/10 hover:text-white"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}
            >
              {label} →
            </Link>
          ))}
        </div>
      </div>

      {/* Format tabs */}
      <div className="flex gap-1.5">
        {KTC_FORMATS.map((f) => {
          const isActive = f.id === formatId;
          return (
            <Link
              key={f.id}
              href={`/admin/ktc?format=${f.id}`}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-all"
              style={
                isActive
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
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      {!snapshot ? (
        <div className="glass-card rounded-2xl px-6 py-10 text-center text-sm text-white/40">
          No snapshot yet. Run an import first.
        </div>
      ) : values.length === 0 ? (
        <div className="glass-card rounded-2xl px-6 py-10 text-center">
          <p className="text-sm text-white/40">
            No KTC data for <strong className="text-white/60">{formatLabel}</strong>.
          </p>
          <p className="mt-2 text-xs text-white/25">
            Run{" "}
            <code
              className="rounded-lg px-1.5 py-0.5 font-mono text-xs text-white/60"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              npm run import:keeptradecut
            </code>{" "}
            to populate values.
          </p>
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
                  KTC Value
                </th>
              </tr>
            </thead>
            <tbody>
              {values.map((row, i) => (
                <tr
                  key={row.playerId}
                  className="transition-colors hover:bg-white/[0.03]"
                  style={
                    i !== values.length - 1
                      ? { borderBottom: "1px solid rgba(255,255,255,0.05)" }
                      : {}
                  }
                >
                  <td className="px-4 py-2.5 text-xs tabular-nums text-white/25">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/players/${row.player.id}`}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <TeamLogo team={row.player.team} size={18} />
                      <span className="font-medium text-white/88">{row.player.name}</span>
                      {row.player.team && (
                        <span className="ml-0.5 text-xs text-white/35">{row.player.team}</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color:
                          POSITION_COLORS[row.player.position] ?? "rgba(255,255,255,0.50)",
                      }}
                    >
                      {row.player.position}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="tabular-nums font-bold text-white/85">{row.value}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-white/25">
        {values.length} player{values.length !== 1 ? "s" : ""} · Source: KeepTradeCut ·{" "}
        {formatLabel}
      </p>
    </div>
  );
}
