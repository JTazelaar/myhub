import { prisma } from "@/lib/db/prisma";

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

/** Maps playerId -> value for the most recent snapshot. Empty if no snapshot exists yet.
 *  When a player has multiple source values, the highest-priority source wins. */
export async function getLatestValuesMap(): Promise<Map<number, number>> {
  const snapshot = await getLatestSnapshot();
  if (!snapshot) return new Map();

  const values = await prisma.playerValue.findMany({
    where: { snapshotId: snapshot.id },
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
          value: v.value,
        })),
      });
    }
  }

  return snapshot;
}
