#!/usr/bin/env tsx
/**
 * Imports player values from FantasyCalc's free public API for every
 * supported redraft format (standard/half-PPR/PPR × 1QB/Superflex plus
 * TE-premium variants).
 *
 * FantasyCalc aggregates 2.6M+ real trades to produce market-consensus
 * player values updated multiple times per day. This script fetches values
 * for each format combination and maps them onto our 1–99 scale.
 *
 * Usage:
 *   npx tsx scripts/import-fantasycalc.ts
 */

import "dotenv/config";
import { prisma } from "../lib/db/prisma";
import { getOrCreateCurrentSnapshot } from "../lib/rankings/snapshots";
import { FORMATS } from "../lib/formats";

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
    const snapshot = await getOrCreateCurrentSnapshot();

    // Build name → player ID lookup once for all formats
    const ourPlayers = await prisma.player.findMany({ where: { isActive: true } });
    const byName = new Map(ourPlayers.map((p) => [normalizeName(p.name), p.id]));

    let totalUpdated = 0;
    let totalUnmatched = 0;
    const formatResults: string[] = [];

    for (const format of FORMATS) {
      const params = new URLSearchParams(
        Object.entries(format.fcParams).map(([k, v]) => [k, String(v)]),
      );
      const url = `${FC_API}?${params}`;
      console.log(`Fetching ${format.label}...`);

      const res = await fetch(url, {
        headers: { "User-Agent": "fantasy-trade-calculator/1.0" },
      });
      if (!res.ok) {
        console.warn(`FantasyCalc returned ${res.status} for ${format.id} — skipping`);
        continue;
      }

      const data = (await res.json()) as FcEntry[];
      const maxFcValue = Math.max(...data.map((d) => d.value));
      if (maxFcValue === 0) {
        console.warn(`Format ${format.id} returned all-zero values — skipping`);
        continue;
      }

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
              where: {
                playerId_snapshotId_source_format: {
                  playerId,
                  snapshotId: snapshot.id,
                  source: "fantasycalc",
                  format: format.id,
                },
              },
              update: { value },
              create: {
                playerId,
                snapshotId: snapshot.id,
                source: "fantasycalc",
                format: format.id,
                value,
              },
            }),
          ),
        );
      }

      totalUpdated += updates.length;
      totalUnmatched = Math.max(totalUnmatched, unmatched);
      formatResults.push(`${format.id}:${updates.length}`);
      console.log(`  → updated ${updates.length}, unmatched ${unmatched}`);
    }

    const summary =
      `Imported ${FORMATS.length} formats from FantasyCalc. ` +
      `Total player-format pairs updated: ${totalUpdated}. ` +
      `Formats: ${formatResults.join(", ")}`;
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
