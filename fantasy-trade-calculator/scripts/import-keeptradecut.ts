#!/usr/bin/env tsx
/**
 * Imports player values from KeepTradeCut (KTC).
 *
 * KTC aggregates dynasty and redraft community trade values. This script
 * fetches their 1QB redraft rankings and maps them onto our 1-99 scale
 * (top player = 99, everyone else scaled linearly).
 *
 * KTC does not publish an official public API. The endpoint below is
 * community-discovered and may change. If it stops working, check
 * https://keeptradecut.com/fantasy-football/rankings for the current
 * data source (open DevTools → Network → look for a JSON array response).
 *
 * Usage:
 *   npx tsx scripts/import-keeptradecut.ts
 */

import "dotenv/config";
import { prisma } from "../lib/db/prisma";
import { getOrCreateCurrentSnapshot } from "../lib/rankings/snapshots";

// KTC community-discovered endpoint for redraft rankings.
// format=1 = redraft, leagueType=0 = 1QB standard
const KTC_API = "https://keeptradecut.com/api/v1/query?format=1&leagueType=0";

type KtcPlayer = {
  playerName: string;
  position: string;
  positionId: number;
  slug: string;
  oneQBValues: {
    value: number;
    rank: number;
    positionalRank: number;
  } | null;
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
    data: { source: "keeptradecut", status: "running" },
  });

  try {
    console.log("Fetching KeepTradeCut values...");

    const res = await fetch(KTC_API, {
      headers: {
        "User-Agent": "fantasy-trade-calculator/1.0",
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`KTC API returned ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as KtcPlayer[];
    if (!Array.isArray(data)) throw new Error("KTC response was not an array");
    console.log(`Got ${data.length} players from KTC`);

    // Filter to skill positions with a value
    const ranked = data.filter(
      (p) =>
        p.oneQBValues != null &&
        p.oneQBValues.value > 0 &&
        ["QB", "RB", "WR", "TE"].includes(p.position),
    );

    // Normalize KTC scale to 1-99
    const maxValue = Math.max(...ranked.map((p) => p.oneQBValues!.value));
    if (maxValue === 0) throw new Error("KTC returned all-zero values");

    // Build name → player ID lookup
    const ourPlayers = await prisma.player.findMany({ where: { isActive: true } });
    const byName = new Map(ourPlayers.map((p) => [normalizeName(p.name), p.id]));

    const snapshot = await getOrCreateCurrentSnapshot();
    const updates: { playerId: number; value: number }[] = [];
    let unmatched = 0;

    for (const entry of ranked) {
      const playerId = byName.get(normalizeName(entry.playerName));
      if (!playerId) {
        unmatched++;
        continue;
      }
      const scaled = Math.max(
        1,
        Math.min(99, Math.round((entry.oneQBValues!.value / maxValue) * 98) + 1),
      );
      updates.push({ playerId, value: scaled });
    }

    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map(({ playerId, value }) =>
          prisma.playerValue.upsert({
            where: {
              playerId_snapshotId_source: {
                playerId,
                snapshotId: snapshot.id,
                source: "keeptradecut",
              },
            },
            update: { value },
            create: { playerId, snapshotId: snapshot.id, source: "keeptradecut", value },
          }),
        ),
      );
    }

    const summary = `Fetched ${data.length} players from KTC. Updated ${updates.length}, skipped ${unmatched} unmatched.`;
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
