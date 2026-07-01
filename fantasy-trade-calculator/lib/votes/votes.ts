import { prisma } from "@/lib/db/prisma";
import { listPlayers } from "@/lib/players/players";
import { getLatestValuesMap } from "@/lib/rankings/snapshots";
import { DEFAULT_FORMAT_ID } from "@/lib/formats";

export type VotablePlayer = {
  id: number;
  name: string;
  position: string;
  team: string | null;
  value: number;
};

/** Picks two distinct random active players that have a current value for the given format. */
export async function getRandomPlayerPair(
  formatId = DEFAULT_FORMAT_ID,
): Promise<[VotablePlayer, VotablePlayer] | null> {
  const [players, valuesMap] = await Promise.all([listPlayers(), getLatestValuesMap(formatId)]);

  const eligible = players
    .filter((p) => p.isActive && valuesMap.has(p.id))
    .map((p) => ({ ...p, value: valuesMap.get(p.id)! }));

  if (eligible.length < 2) return null;
  const first = eligible[Math.floor(Math.random() * eligible.length)];
  let second = eligible[Math.floor(Math.random() * eligible.length)];
  while (second.id === first.id) { second = eligible[Math.floor(Math.random() * eligible.length)]; }
  return [first, second];
}

export async function recordVote(
  playerAId: number,
  playerBId: number,
  winnerId: number,
  format = DEFAULT_FORMAT_ID,
) {
  return prisma.matchupVote.create({
    data: { playerAId, playerBId, winnerId, format },
  });
}
