#!/usr/bin/env tsx
/**
 * Imports college and Sleeper player ID from the Sleeper NFL player database.
 *
 * Sleeper publishes a free, no-auth endpoint with all NFL players including
 * their college. We match players to our DB by name and update the `college`
 * and `sleeperId` fields.
 *
 * Usage:
 *   npx tsx scripts/import-sleeper-colleges.ts
 */

import "dotenv/config";
import { prisma } from "../lib/db/prisma";

const SLEEPER_PLAYERS_URL = "https://api.sleeper.app/v1/players/nfl";

type SleeperPlayerEntry = {
  player_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  position: string | null;
  team: string | null;
  college: string | null;
  active: boolean;
};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+(jr|sr|ii|iii|iv|v)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  console.log("Fetching Sleeper player database...");
  const res = await fetch(SLEEPER_PLAYERS_URL, {
    headers: { "User-Agent": "fantasy-trade-calculator/1.0" },
  });
  if (!res.ok) throw new Error(`Sleeper returned ${res.status}`);

  const raw = (await res.json()) as Record<string, SleeperPlayerEntry>;
  console.log(`Loaded ${Object.keys(raw).length} Sleeper players`);

  // Build normalized name → { sleeperId, college }
  const byName = new Map<string, { sleeperId: string; college: string | null }>();
  for (const [id, p] of Object.entries(raw)) {
    if (!p.first_name || !p.last_name) continue;
    if (!["QB", "RB", "WR", "TE"].includes(p.position ?? "")) continue;
    const full = p.full_name ?? `${p.first_name} ${p.last_name}`;
    byName.set(normalizeName(full), { sleeperId: id, college: p.college ?? null });
  }

  const ourPlayers = await prisma.player.findMany({ where: { isActive: true } });
  console.log(`Matching against ${ourPlayers.length} active players...`);

  let matched = 0;
  let withCollege = 0;

  for (const player of ourPlayers) {
    const entry = byName.get(normalizeName(player.name));
    if (!entry) continue;

    await prisma.player.update({
      where: { id: player.id },
      data: {
        sleeperId: entry.sleeperId,
        college: entry.college ?? undefined,
      },
    });

    matched++;
    if (entry.college) withCollege++;
  }

  console.log(`Updated ${matched} players — ${withCollege} with college data`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
