#!/usr/bin/env tsx
/**
 * Imports player values from KeepTradeCut (KTC) for multiple formats.
 *
 * KTC does not offer separate PPR tiers, so each leagueType maps to a
 * representative format:
 *   leagueType=0  → ppr_1qb (1QB redraft)
 *   leagueType=1  → ppr_2qb (Superflex redraft)
 *   leagueType=2  → teprem_ppr_1qb (TE-premium redraft)
 *
 * KTC does not publish an official public API. The endpoint below is
 * community-discovered and may change.
 *
 * Usage:
 *   npx tsx scripts/import-keeptradecut.ts
 */

import "dotenv/config";
import { prisma } from "../lib/db/prisma";
import { getOrCreateCurrentSnapshot } from "../lib/rankings/snapshots";

const KTC_BASE = "https://keeptradecut.com/api/v1/query?format=1";

type KtcPlayer = {
  playerName: string;
  position: string;
  positionId: number;
  slug: string;
  oneQBValues: { value: number; rank: number; positionalRank: number } | null;
  superflexValues?: { value: number; rank: number; positionalRank: number } | null;
};

const KTC_FORMATS: {
  leagueType: number;
  formatId: string;
  valueField: "oneQBValues" | "superflexValues";
}[] = [
  { leagueType: 0, formatId: "ppr_1qb", valueField: "oneQBValues" },
  { leagueType: 1, formatId: "ppr_2qb", valueField: "superflexValues" },
  { leagueType: 2, formatId: "teprem_ppr_1qb", valueField: "oneQBValues" },
];

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
    const snapshot = await getOrCreateCurrentSnapshot();
    const ourPlayers = await prisma.player.findMany({ where: { isActive: true } });
    const byName = new Map(ourPlayers.map((p) => [normalizeName(p.name), p.id]));

    let totalUpdated = 0;
    const formatResults: string[] = [];

    for (const { leagueType, formatId, valueField } of KTC_FORMATS) {
      const url = `${KTC_BASE}&leagueType=${leagueType}`;
      console.log(`Fetching KTC leagueType=${leagueType} (${formatId})...`);

      const res = await fetch(url, {
        headers: { "User-Agent": "fantasy-trade-calculator/1.0", Accept: "application/json" },
      });
      if (!res.ok) {
        console.warn(`KTC returned ${res.status} for leagueType=${leagueType} — skipping`);
        continue;
      }

      const data = (await res.json()) as KtcPlayer[];
      if (!Array.isArray(data)) {
        console.warn(`KTC response for leagueType=${leagueType} was not an array — skipping`);
        continue;
      }

      const ranked = data.filter(
        (p) =>
          p[valueField] != null &&
          (p[valueField] as { value: number }).value > 0 &&
          ["QB", "RB", "WR", "TE"].includes(p.position),
      );

      const maxValue = Math.max(...ranked.map((p) => (p[valueField] as { value: number }).value));
      if (maxValue === 0) {
        console.warn(`KTC leagueType=${leagueType} returned all-zero values — skipping`);
        continue;
      }

      const updates: { playerId: number; value: number }[] = [];
      let unmatched = 0;

      for (const entry of ranked) {
        const playerId = byName.get(normalizeName(entry.playerName));
        if (!playerId) { unmatched++; continue; }
        const raw = (entry[valueField] as { value: number }).value;
        const scaled = Math.max(1, Math.min(99, Math.round((raw / maxValue) * 98) + 1));
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
                  source: "keeptradecut",
                  format: formatId,
                },
              },
              update: { value },
              create: {
                playerId,
                snapshotId: snapshot.id,
                source: "keeptradecut",
                format: formatId,
                value,
              },
            }),
          ),
        );
      }

      totalUpdated += updates.length;
      formatResults.push(`${formatId}:${updates.length}`);
      console.log(`  → updated ${updates.length}, unmatched ${unmatched}`);
    }

    const summary =
      `Imported ${KTC_FORMATS.length} formats from KTC. ` +
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
