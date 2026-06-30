#!/usr/bin/env tsx
/**
 * Imports player values from FantasyCalc's free public API.
 *
 * FantasyCalc aggregates 2.6M+ real trades to produce market-consensus
 * player values, updated multiple times per day. This script fetches those
 * values for standard 12-team PPR redraft and maps them onto our 1–99 scale
 * (top player = 99, everyone else scaled linearly).
 *
 * Usage:
 *   npx tsx scripts/import-fantasycalc.ts
 */

import "dotenv/config";
import { prisma } from "../lib/db/prisma";
import { getOrCreateCurrentSnapshot } from "../lib/rankings/snapshots";

const FC_API = "https://api.fantasycalc.com/values/current";

type FcEntry = {
  player: {
    name: string;
    position: string;
    sleeperId: string | null;
  };
  value: number;
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
  const run = await prisma.importRun.create({
    data: { source: "fantasycalc", status: "running" },
  });

  try {
    const url = `${FC_API}?isDynasty=false&numQbs=1&ppr=1&numTeams=12`;
    console.log(`Fetching FantasyCalc values...`);

    const res = await fetch(url, {
      headers: { "User-Agent": "fantasy-trade-calculator/1.0" },
    });
    if (!res.ok) throw new Error(`FantasyCalc API returned ${res.status}`);

    const data = (await res.json()) as FcEntry[];
    console.log(`Got ${data.length} players from FantasyCalc`);

    // Normalize their scale (0–~9000) onto our 1–99 scale
    const maxFcValue = Math.max(...data.map((d) => d.value));
    if (maxFcValue === 0) throw new Error("FantasyCalc returned all-zero values");

    // Build name → our player ID lookup
    const ourPlayers = await prisma.player.findMany({ where: { isActive: true } });
    const byName = new Map(ourPlayers.map((p) => [normalizeName(p.name), p.id]));

    const snapshot = await getOrCreateCurrentSnapshot();
    const updates: { playerId: number; value: number }[] = [];
    let unmatched = 0;

    for (const entry of data) {
      if (entry.value === 0) continue;
      const playerId = byName.get(normalizeName(entry.player.name));
      if (!playerId) {
        unmatched++;
        continue;
      }
      const scaled = Math.max(1, Math.min(99, Math.round((entry.value / maxFcValue) * 98) + 1));
      updates.push({ playerId, value: scaled });
    }

    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map(({ playerId, value }) =>
          prisma.playerValue.upsert({
            where: { playerId_snapshotId: { playerId, snapshotId: snapshot.id } },
            update: { value },
            create: { playerId, snapshotId: snapshot.id, value },
          }),
        ),
      );
    }

    const summary = `Fetched ${data.length} players from FantasyCalc. Updated ${updates.length}, skipped ${unmatched} unmatched.`;
    console.log(summary);

    await prisma.importRun.update({
      where: { id: run.id },
      data: { status: "success", summary, finishedAt: new Date() },
    });
  } catch (error) {
    await prisma.importRun.update({
      where: { id: run.id },
      data: { status: "error", summary: String(error), finishedAt: new Date() },
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
