#!/usr/bin/env tsx
/**
 * Imports NFL weekly fantasy stats from the Sleeper Stats API.
 *
 * Sleeper provides per-player weekly stats (points, yards, TDs, etc.) for
 * every NFL season and week — free, no auth required.
 *
 * Usage:
 *   npx tsx scripts/import-weekly-stats.ts                 # current week
 *   npx tsx scripts/import-weekly-stats.ts --week 3        # specific week, current season
 *   npx tsx scripts/import-weekly-stats.ts --week 1 --season 2026
 *   npx tsx scripts/import-weekly-stats.ts --preseason --week 1
 *
 * Stats are locked (locked=true) once imported since they represent past games.
 */

import "dotenv/config";
import { prisma } from "../lib/db/prisma";

const SLEEPER_BASE = "https://api.sleeper.app/v1";

type SleeperStat = {
  gp?: number;
  pts_std?: number;
  pts_half_ppr?: number;
  pts_ppr?: number;
  pass_yd?: number;
  pass_td?: number;
  pass_int?: number;
  rush_yd?: number;
  rush_td?: number;
  rec?: number;
  rec_yd?: number;
  rec_td?: number;
};

type NflState = { season: string; week: number; season_type: string };

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };
  return {
    isPreseason: args.includes("--preseason"),
    week: get("--week") ? parseInt(get("--week")!) : undefined,
    season: get("--season") ? parseInt(get("--season")!) : undefined,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": "fantasy-trade-calculator/1.0" } });
  if (!res.ok) throw new Error(`Sleeper ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

async function main() {
  const opts = parseArgs();

  // Determine season + week
  let season: number;
  let week: number;
  let seasonType: "pre" | "regular";

  if (opts.week != null && opts.season != null) {
    season = opts.season;
    week = opts.week;
    seasonType = opts.isPreseason ? "pre" : "regular";
  } else {
    const state = await fetchJson<NflState>(`${SLEEPER_BASE}/state/nfl`);
    season = parseInt(state.season);
    week = opts.week ?? state.week;
    seasonType = opts.isPreseason ? "pre" : (state.season_type === "pre" ? "pre" : "regular");
  }

  console.log(`Fetching ${seasonType} stats for season=${season} week=${week}...`);

  const statsUrl = `${SLEEPER_BASE}/stats/nfl/${seasonType}/${season}/${week}`;
  const raw = await fetchJson<Record<string, SleeperStat>>(statsUrl);
  console.log(`Received stats for ${Object.keys(raw).length} players`);

  // Load players with their Sleeper IDs
  const players = await prisma.player.findMany({
    where: { isActive: true, sleeperId: { not: null } },
    select: { id: true, sleeperId: true },
  });

  const sleeperToOurId = new Map<string, number>();
  for (const p of players) {
    if (p.sleeperId) sleeperToOurId.set(p.sleeperId, p.id);
  }

  console.log(`Matching against ${players.length} players with Sleeper IDs`);

  type StatRow = {
    playerId: number; season: number; week: number; seasonType: string;
    ptsStd: number | null; ptsHalfPpr: number | null; ptsPpr: number | null;
    passYd: number | null; passTd: number | null; passInt: number | null;
    rushYd: number | null; rushTd: number | null;
    rec: number | null; recYd: number | null; recTd: number | null;
    locked: boolean;
  };
  const updates: StatRow[] = [];
  let matched = 0;
  let skipped = 0;

  for (const [sleeperId, stat] of Object.entries(raw)) {
    const playerId = sleeperToOurId.get(sleeperId);
    if (!playerId) { skipped++; continue; }
    if (!stat.gp || stat.gp === 0) continue; // player's team had a bye or didn't play

    updates.push({
      playerId,
      season,
      week,
      seasonType,
      ptsStd: stat.pts_std ?? null,
      ptsHalfPpr: stat.pts_half_ppr ?? null,
      ptsPpr: stat.pts_ppr ?? null,
      passYd: stat.pass_yd != null ? Math.round(stat.pass_yd) : null,
      passTd: stat.pass_td != null ? Math.round(stat.pass_td) : null,
      passInt: stat.pass_int != null ? Math.round(stat.pass_int) : null,
      rushYd: stat.rush_yd != null ? Math.round(stat.rush_yd) : null,
      rushTd: stat.rush_td != null ? Math.round(stat.rush_td) : null,
      rec: stat.rec != null ? Math.round(stat.rec) : null,
      recYd: stat.rec_yd != null ? Math.round(stat.rec_yd) : null,
      recTd: stat.rec_td != null ? Math.round(stat.rec_td) : null,
      locked: true,
    });
    matched++;
  }

  console.log(`Upserting ${matched} player stat rows (${skipped} unmatched)...`);

  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map((data) =>
        prisma.playerWeeklyStats.upsert({
          where: {
            playerId_season_week_seasonType: {
              playerId: data.playerId,
              season: data.season,
              week: data.week,
              seasonType: data.seasonType,
            },
          },
          update: {
            ptsStd: data.ptsStd,
            ptsHalfPpr: data.ptsHalfPpr,
            ptsPpr: data.ptsPpr,
            passYd: data.passYd,
            passTd: data.passTd,
            passInt: data.passInt,
            rushYd: data.rushYd,
            rushTd: data.rushTd,
            rec: data.rec,
            recYd: data.recYd,
            recTd: data.recTd,
            locked: true,
          },
          create: data,
        }),
      ),
      { timeout: 60000 },
    );
  }

  console.log(`Done. Imported ${matched} stat rows for ${seasonType} S${season}W${week}.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
