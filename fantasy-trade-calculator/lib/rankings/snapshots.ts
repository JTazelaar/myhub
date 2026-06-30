import { prisma } from "@/lib/db/prisma";
export async function getLatestSnapshot() { return prisma.rankingSnapshot.findFirst({ orderBy: [{ season: "desc" }, { week: "desc" }] }); }
export async function listSnapshots() { return prisma.rankingSnapshot.findMany({ orderBy: [{ season: "desc" }, { week: "desc" }], include: { _count: { select: { values: true } } } }); }
export async function getLatestValuesMap(): Promise<Map<number, number>> {
  const snapshot = await getLatestSnapshot();
  if (!snapshot) return new Map();
  const values = await prisma.playerValue.findMany({ where: { snapshotId: snapshot.id } });
  return new Map(values.map((v) => [v.playerId, v.value]));
}
export async function getOrCreateCurrentSnapshot() {
  const existing = await getLatestSnapshot();
  if (existing) return existing;
  const now = new Date();
  return prisma.rankingSnapshot.create({ data: { season: now.getFullYear(), week: 1, label: "Initial values" } });
}
export async function createNextSnapshot(input: { season: number; week: number; label: string; notes?: string }) {
  const previous = await getLatestSnapshot();
  const snapshot = await prisma.rankingSnapshot.create({ data: { season: input.season, week: input.week, label: input.label, notes: input.notes } });
  if (previous) {
    const previousValues = await prisma.playerValue.findMany({ where: { snapshotId: previous.id } });
    if (previousValues.length > 0) {
      await prisma.playerValue.createMany({ data: previousValues.map((v) => ({ playerId: v.playerId, snapshotId: snapshot.id, value: v.value })) });
    }
  }
  return snapshot;
}
