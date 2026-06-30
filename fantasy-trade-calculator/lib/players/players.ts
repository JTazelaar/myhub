import { prisma } from "@/lib/db/prisma";
import { getLatestValuesMap, getOrCreateCurrentSnapshot } from "@/lib/rankings/snapshots";
export async function listPlayers() { return prisma.player.findMany({ orderBy: { name: "asc" } }); }
export async function getPlayer(id: number) { return prisma.player.findUnique({ where: { id } }); }
export async function createPlayer(input: { name: string; position: string; team?: string }) {
  return prisma.player.create({ data: { name: input.name, position: input.position, team: input.team || null } });
}
export async function setPlayerValue(playerId: number, value: number) {
  const snapshot = await getOrCreateCurrentSnapshot();
  return prisma.playerValue.upsert({
    where: { playerId_snapshotId: { playerId, snapshotId: snapshot.id } },
    update: { value },
    create: { playerId, snapshotId: snapshot.id, value },
  });
}
export type PlayerWithValue = Awaited<ReturnType<typeof listPlayers>>[number] & { value: number | null };
export async function listPlayersWithValues(): Promise<PlayerWithValue[]> {
  const [players, valuesMap] = await Promise.all([listPlayers(), getLatestValuesMap()]);
  return players.map((player) => ({ ...player, value: valuesMap.get(player.id) ?? null }));
}
