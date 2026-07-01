import { prisma } from "@/lib/db/prisma";
import {
  getLatestValuesMap,
  getOrCreateCurrentSnapshot,
} from "@/lib/rankings/snapshots";
import { DEFAULT_FORMAT_ID } from "@/lib/formats";

export async function listPlayers() {
  return prisma.player.findMany({ orderBy: { name: "asc" } });
}

export async function getPlayer(id: number) {
  return prisma.player.findUnique({ where: { id } });
}

export async function createPlayer(input: {
  name: string;
  position: string;
  team?: string;
}) {
  return prisma.player.create({
    data: {
      name: input.name,
      position: input.position,
      team: input.team || null,
    },
  });
}

/** Sets a player's manual value override in the current snapshot.
 *  Manual overrides use format "all" so they apply across every format. */
export async function setPlayerValue(playerId: number, value: number) {
  const snapshot = await getOrCreateCurrentSnapshot();

  return prisma.playerValue.upsert({
    where: {
      playerId_snapshotId_source_format: {
        playerId,
        snapshotId: snapshot.id,
        source: "manual",
        format: "all",
      },
    },
    update: { value },
    create: { playerId, snapshotId: snapshot.id, source: "manual", format: "all", value },
  });
}

export type PlayerWithValue = Awaited<ReturnType<typeof listPlayers>>[number] & {
  value: number | null;
};

export async function listPlayersWithValues(
  format = DEFAULT_FORMAT_ID,
): Promise<PlayerWithValue[]> {
  const [players, valuesMap] = await Promise.all([
    listPlayers(),
    getLatestValuesMap(format),
  ]);

  return players.map((player) => ({
    ...player,
    value: valuesMap.get(player.id) ?? null,
  }));
}
