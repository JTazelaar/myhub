import Link from "next/link";
import { AdminNotice } from "@/components/AdminNotice";
import { prisma } from "@/lib/db/prisma";
import { getLatestSnapshot } from "@/lib/rankings/snapshots";
import { RankingsClient } from "./RankingsClient";

export const dynamic = "force-dynamic";

// Sources shown as columns. "manual" is an override and is excluded from
// the comparison — it blends into the consensus via getLatestValuesMap().
const COMPARISON_SOURCES = ["fantasycalc", "keeptradecut"];

export default async function RankingsPage() {
  const snapshot = await getLatestSnapshot();

  if (!snapshot) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
        <AdminNotice />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Rankings Comparison</h1>
          <Link
            href="/admin"
            className="rounded-full px-3 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            style={{ border: "1px solid rgba(255,255,255,0.12)" }}
          >
            ← Players
          </Link>
        </div>
        <div className="glass-card rounded-2xl px-6 py-10 text-center text-sm text-white/40">
          No snapshot yet. Run an import first to populate player values.
        </div>
      </div>
    );
  }

  const values = await prisma.playerValue.findMany({
    where: {
      snapshotId: snapshot.id,
      source: { in: COMPARISON_SOURCES },
    },
    include: { player: { select: { id: true, name: true, position: true, team: true } } },
  });

  const presentSources = COMPARISON_SOURCES.filter((src) =>
    values.some((v) => v.source === src),
  );

  const playerMap = new Map<
    number,
    { name: string; position: string; team: string | null; bySource: Record<string, number> }
  >();
  for (const v of values) {
    if (!playerMap.has(v.playerId)) {
      playerMap.set(v.playerId, {
        name: v.player.name,
        position: v.player.position,
        team: v.player.team,
        bySource: {},
      });
    }
    playerMap.get(v.playerId)!.bySource[v.source] = v.value;
  }

  const rows = [...playerMap.entries()].map(([playerId, { name, position, team, bySource }]) => {
    const vals = presentSources
      .map((s) => bySource[s])
      .filter((v): v is number => v != null);
    const consensus = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b) / vals.length) : null;
    return { playerId, name, position, team, bySource, consensus };
  });

  rows.sort((a, b) => (b.consensus ?? -1) - (a.consensus ?? -1));

  const rankBySource: Record<string, Map<number, number>> = {};
  for (const src of presentSources) {
    const sorted = [...rows]
      .filter((r) => r.bySource[src] != null)
      .sort((a, b) => (b.bySource[src] ?? 0) - (a.bySource[src] ?? 0));
    const m = new Map<number, number>();
    sorted.forEach((r, i) => m.set(r.playerId, i + 1));
    rankBySource[src] = m;
  }

  const clientRows = rows.map((r) => ({
    ...r,
    rankBySource: Object.fromEntries(
      presentSources.map((src) => [src, rankBySource[src]?.get(r.playerId) ?? 0]),
    ),
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <AdminNotice />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rankings Comparison</h1>
          <p className="mt-0.5 text-sm text-white/40">
            {snapshot.label} · Week {snapshot.week}, {snapshot.season}
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-full px-3 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          style={{ border: "1px solid rgba(255,255,255,0.12)" }}
        >
          ← Players
        </Link>
      </div>

      {presentSources.length === 0 ? (
        <div className="glass-card rounded-2xl px-6 py-10 text-center">
          <p className="text-sm text-white/40">
            No source data yet. Run{" "}
            <code
              className="rounded-lg px-1.5 py-0.5 font-mono text-xs text-white/60"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              npm run import:fantasycalc
            </code>{" "}
            or{" "}
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
        <RankingsClient rows={clientRows} sources={presentSources} />
      )}
    </div>
  );
}