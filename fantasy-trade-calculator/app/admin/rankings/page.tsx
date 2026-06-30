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
          <h1 className="text-2xl font-bold">Rankings Comparison</h1>
          <Link href="/admin" className="text-sm font-medium text-blue-600 hover:underline">
            ← Players
          </Link>
        </div>
        <p className="text-sm text-zinc-500">
          No snapshot yet. Run an import first to populate player values.
        </p>
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

  // Determine which sources actually have data
  const presentSources = COMPARISON_SOURCES.filter((src) =>
    values.some((v) => v.source === src),
  );

  // Group by player
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

  // Compute consensus (average across all present sources for this player)
  const rows = [...playerMap.entries()].map(([playerId, { name, position, team, bySource }]) => {
    const vals = presentSources
      .map((s) => bySource[s])
      .filter((v): v is number => v != null);
    const consensus = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b) / vals.length) : null;
    return { playerId, name, position, team, bySource, consensus };
  });

  // Sort by consensus descending (players missing all sources fall to bottom)
  rows.sort((a, b) => (b.consensus ?? -1) - (a.consensus ?? -1));

  // Compute per-source ranks
  const rankBySource: Record<string, Map<number, number>> = {};
  for (const src of presentSources) {
    const sorted = [...rows]
      .filter((r) => r.bySource[src] != null)
      .sort((a, b) => (b.bySource[src] ?? 0) - (a.bySource[src] ?? 0));
    const m = new Map<number, number>();
    sorted.forEach((r, i) => m.set(r.playerId, i + 1));
    rankBySource[src] = m;
  }

  // Merge rank maps into each row for serialization to the client component
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
          <h1 className="text-2xl font-bold">Rankings Comparison</h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {snapshot.label} · Week {snapshot.week}, {snapshot.season}
          </p>
        </div>
        <Link href="/admin" className="text-sm font-medium text-blue-600 hover:underline">
          ← Players
        </Link>
      </div>

      {presentSources.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 px-4 py-8 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-500">
            No source data yet. Run{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
              npm run import:fantasycalc
            </code>{" "}
            or{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
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
