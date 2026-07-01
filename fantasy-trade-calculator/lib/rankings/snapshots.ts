import { prisma } from "@/lib/db/prisma";
import { DEFAULT_FORMAT_ID } from "@/lib/formats";

export async function getLatestSnapshot() {
  return prisma.rankingSnapshot.findFirst({
    orderBy: [{ season: "desc" }, { week: "desc" }],
  });
}

export async function listSnapshots() {
  return prisma.rankingSnapshot.findMany({
    orderBy: [{ season: "desc" }, { week: "desc" }],
    include: { _count: { select: { values: true } } },
  });
}

// Priority order for the "canonical" value used by the calculator.
// manual overrides beat automated imports; fantasycalc is the primary source.
const SOURCE_PRIORITY: Record<string, number> = {
  manual: 0,
  fantasycalc: 1,
  keeptradecut: 2,
};

/** Maps playerId → value for the most recent snapshot and given format.
 *  "all" format rows (manual overrides) are always included and win over
 *  automated imports for the same player. */
export async function getLatestValuesMap(
  format = DEFAULT_FORMAT_ID,
): Promise<Map<number, number>> {
  const snapshot = await getLatestSnapshot();
  if (!snapshot) return new Map();

  const values = await prisma.playerValue.findMany({
    where: {
      snapshotId: snapshot.id,
      format: { in: [format, "all"] },
    },
  });

  const best = new Map<number, { value: number; priority: number }>();
  for (const v of values) {
    const priority = SOURCE_PRIORITY[v.source] ?? 99;
    const existing = best.get(v.playerId);
    if (!existing || priority < existing.priority) {
      best.set(v.playerId, { value: v.value, priority });
    }
  }

  return new Map([...best.entries()].map(([id, { value }]) => [id, value]));
}

/** Returns ranked player rows for the latest snapshot + given format,
 *  sorted by value descending. Useful for the public rankings page. */
export async function getLatestRankings(format = DEFAULT_FORMAT_ID) {
  const snapshot = await getLatestSnapshot();
  if (!snapshot) return [];

  const values = await prisma.playerValue.findMany({
    where: {
      snapshotId: snapshot.id,
      format: { in: [format, "all"] },
    },
    include: {
      player: { select: { id: true, name: true, position: true, team: true } },
    },
  });

  // Deduplicate: manual "all" overrides win over automated imports
  const best = new Map<
    number,
    { player: (typeof values)[0]["player"]; value: number; priority: number }
  >();
  for (const v of values) {
    const priority = SOURCE_PRIORITY[v.source] ?? 99;
    const existing = best.get(v.playerId);
    if (!existing || priority < existing.priority) {
      best.set(v.playerId, { player: v.player, value: v.value, priority });
    }
  }

  return [...best.values()]
    .sort((a, b) => b.value - a.value)
    .map(({ player, value }, i) => ({ rank: i + 1, player, value }));
}

/** Returns the latest snapshot, creating a default first one if none exists yet. */
export async function getOrCreateCurrentSnapshot() {
  const existing = await getLatestSnapshot();
  if (existing) return existing;

  const now = new Date();
  return prisma.rankingSnapshot.create({
    data: {
      season: now.getFullYear(),
      week: 1,
      label: "Initial values",
    },
  });
}

export async function createNextSnapshot(input: {
  season: number;
  week: number;
  label: string;
  notes?: string;
}) {
  const previous = await getLatestSnapshot();

  const snapshot = await prisma.rankingSnapshot.create({
    data: {
      season: input.season,
      week: input.week,
      label: input.label,
      notes: input.notes,
    },
  });

  if (previous) {
    const previousValues = await prisma.playerValue.findMany({
      where: { snapshotId: previous.id },
    });

    if (previousValues.length > 0) {
      await prisma.playerValue.createMany({
        data: previousValues.map((v) => ({
          playerId: v.playerId,
          snapshotId: snapshot.id,
          source: v.source,
          format: v.format,
          value: v.value,
        })),
      });
    }
  }

  return snapshot;
}
