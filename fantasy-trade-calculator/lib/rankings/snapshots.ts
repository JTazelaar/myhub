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

/** Maps playerId -> value for the most recent snapshot. Empty if no snapshot exists yet. */
export async function getLatestValuesMap(): Promise<Map<number, number>> {
  const snapshot = await getLatestSnapshot();
  if (!snapshot) return new Map();

  const values = await prisma.playerValue.findMany({
    where: { snapshotId: snapshot.id },
  });

  return new Map(values.map((v) => [v.playerId, v.value]));
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

  // Carry forward the previous week's values so the new week starts with a
  // full set of values that the admin can then tweak, instead of blank.
  if (previous) {
    const previousValues = await prisma.playerValue.findMany({
      where: { snapshotId: previous.id },
    });

    if (previousValues.length > 0) {
      await prisma.playerValue.createMany({
        data: previousValues.map((v) => ({
          playerId: v.playerId,
          snapshotId: snapshot.id,
          value: v.value,
        })),
      });
    }
  }

  return snapshot;
}
