#!/usr/bin/env tsx
/**
 * Pulls completed trades from a configured set of Sleeper leagues and uses
 * them to nudge player values toward market consensus.
 *
 * How it works:
 *   1. Fetch every completed trade across all configured leagues for the last
 *      WEEKS_TO_LOOK_BACK weeks.
 *   2. For each trade, compare the two packages using our existing power
 *      formula.  If our model says Side A is worth more than Side B, but both
 *      sides agreed to the deal, that is a signal that Side B is undervalued
 *      (or Side A is overvalued).
 *   3. Accumulate those signals across all trades, then apply a capped nudge
 *      (at most MAX_NUDGE_PER_RUN points) to each player's value in the
 *      current snapshot.
 *
 * Configuration (environment variables):
 *   DATABASE_URL          – Postgres connection string (required)
 *   SLEEPER_LEAGUE_IDS    – Comma-separated Sleeper league IDs (required)
 *   SLEEPER_FORMAT        – Format ID to store nudges under (default: halfppr_1qb)
 *
 * To find league IDs for a username:
 *   npx tsx scripts/find-sleeper-leagues.ts <sleeper-username>
 *
 * Usage:
 *   npx tsx scripts/import-sleeper.ts
 */

import "dotenv/config";
import { prisma } from "../lib/db/prisma";
import { getLatestValuesMap, getOrCreateCurrentSnapshot } from "../lib/rankings/snapshots";
import { sidePower } from "../lib/trades/value";
import { DEFAULT_FORMAT_ID } from "../lib/formats";

const SLEEPER_BASE = "https://api.sleeper.app/v1";
const SLEEPER_FORMAT = process.env.SLEEPER_FORMAT ?? DEFAULT_FORMAT_ID;
const WEEKS_TO_LOOK_BACK = 4;
const MAX_NUDGE_PER_RUN = 3;   // max value points to move a player per run
const MIN_TRADES_FOR_SIGNAL = 3; // ignore players seen in fewer trades

// ---------------------------------------------------------------------------
// Name normalisation for fuzzy player matching
// ---------------------------------------------------------------------------

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\./g, "")                          // A.J. → aj
    .replace(/\s+(jr|sr|ii|iii|iv|v)$/i, "")    // strip generational suffixes
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Sleeper API helpers
// ---------------------------------------------------------------------------

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": "fantasy-trade-calculator/1.0" },
  });
  if (!res.ok) throw new Error(`Sleeper API ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

type SleeperPlayer = {
  first_name: string;
  last_name: string;
};

type SleeperTransaction = {
  type: string;
  status: string;
  roster_ids: number[];
  adds: Record<string, number> | null;
};

type NflState = { week: number };

/** Returns a map of normalised player name → Sleeper player ID. */
async function buildSleeperNameMap(): Promise<Map<string, string>> {
  console.log("Fetching Sleeper player list...");
  const raw = await fetchJson<Record<string, SleeperPlayer>>(`${SLEEPER_BASE}/players/nfl`);
  const map = new Map<string, string>();
  for (const [id, p] of Object.entries(raw)) {
    if (!p.first_name || !p.last_name) continue;
    map.set(normalizeName(`${p.first_name} ${p.last_name}`), id);
  }
  return map;
}

async function fetchTrades(leagueId: string, week: number): Promise<SleeperTransaction[]> {
  const data = await fetchJson<SleeperTransaction[]>(
    `${SLEEPER_BASE}/league/${leagueId}/transactions/${week}`,
  );
  return data.filter((t) => t.type === "trade" && t.status === "complete" && t.adds);
}

/**
 * Splits a trade's `adds` map into two packages (one per roster).
 * Returns null for multi-team trades or trades with no player assets.
 *
 * In Sleeper's `adds`: { player_id: roster_id_that_received_them }
 *   pkgA = players that ended up on rosterA  (rosterB gave these up)
 *   pkgB = players that ended up on rosterB  (rosterA gave these up)
 */
function extractPackages(trade: SleeperTransaction): [string[], string[]] | null {
  if (!trade.adds || trade.roster_ids.length !== 2) return null;
  const [rA, rB] = trade.roster_ids;
  const pkgA: string[] = [];
  const pkgB: string[] = [];
  for (const [playerId, rosterId] of Object.entries(trade.adds)) {
    if (rosterId === rA) pkgA.push(playerId);
    else if (rosterId === rB) pkgB.push(playerId);
  }
  if (pkgA.length === 0 || pkgB.length === 0) return null;
  return [pkgA, pkgB];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const leagueIds = (process.env.SLEEPER_LEAGUE_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (leagueIds.length === 0) {
    console.error(
      [
        "Error: SLEEPER_LEAGUE_IDS is not set.",
        "",
        "Find your league IDs by running:",
        "  npx tsx scripts/find-sleeper-leagues.ts <your-sleeper-username>",
        "",
        "Then add to .env (or Vercel / GitHub Actions secrets):",
        "  SLEEPER_LEAGUE_IDS=123456789,987654321",
      ].join("\n"),
    );
    process.exit(1);
  }

  const run = await prisma.importRun.create({
    data: { source: "sleeper", status: "running" },
  });

  try {
    // -----------------------------------------------------------------------
    // Build player ID mappings
    // -----------------------------------------------------------------------
    const sleeperNameMap = await buildSleeperNameMap();

    const ourPlayers = await prisma.player.findMany({ where: { isActive: true } });
    const sleeperToOurId = new Map<string, number>(); // sleeperId → ourPlayerId

    let matched = 0;
    for (const p of ourPlayers) {
      const sleeperId = sleeperNameMap.get(normalizeName(p.name));
      if (sleeperId) {
        sleeperToOurId.set(sleeperId, p.id);
        matched++;
      }
    }
    console.log(`Mapped ${matched}/${ourPlayers.length} players to Sleeper IDs`);

    const valuesMap = await getLatestValuesMap(SLEEPER_FORMAT);

    // -----------------------------------------------------------------------
    // Determine the week range to fetch
    // -----------------------------------------------------------------------
    const { week: currentWeek } = await fetchJson<NflState>(`${SLEEPER_BASE}/state/nfl`);
    const startWeek = Math.max(1, currentWeek - WEEKS_TO_LOOK_BACK);
    console.log(`Fetching weeks ${startWeek}–${currentWeek} from ${leagueIds.length} league(s)`);

    // -----------------------------------------------------------------------
    // Collect trade signals
    // signals: ourPlayerId → { count, totalAdjustment }
    // -----------------------------------------------------------------------
    const signals = new Map<number, { count: number; totalAdjustment: number }>();
    let totalTrades = 0;
    let errors = 0;

    for (const leagueId of leagueIds) {
      for (let week = startWeek; week <= currentWeek; week++) {
        try {
          const trades = await fetchTrades(leagueId, week);
          await sleep(150); // be polite to Sleeper's API

          for (const trade of trades) {
            const pkgs = extractPackages(trade);
            if (!pkgs) continue;
            const [slA, slB] = pkgs;

            const idsA = slA.map((id) => sleeperToOurId.get(id)).filter((id): id is number => id !== undefined);
            const idsB = slB.map((id) => sleeperToOurId.get(id)).filter((id): id is number => id !== undefined);
            if (idsA.length === 0 || idsB.length === 0) continue;

            const powerA = sidePower(idsA.map((id) => valuesMap.get(id) ?? 0));
            const powerB = sidePower(idsB.map((id) => valuesMap.get(id) ?? 0));
            const total = powerA + powerB;
            if (total === 0) continue;

            // imbalance > 0  →  pkgA is undervalued (rosterB gave up more)
            // imbalance < 0  →  pkgB is undervalued (rosterA gave up more)
            const imbalance = (powerB - powerA) / total;
            const nudge = imbalance * MAX_NUDGE_PER_RUN;

            for (const id of idsA) {
              const s = signals.get(id) ?? { count: 0, totalAdjustment: 0 };
              s.count++;
              s.totalAdjustment += nudge;
              signals.set(id, s);
            }
            for (const id of idsB) {
              const s = signals.get(id) ?? { count: 0, totalAdjustment: 0 };
              s.count++;
              s.totalAdjustment -= nudge;
              signals.set(id, s);
            }

            totalTrades++;
          }
        } catch (err) {
          console.warn(`Skipped league ${leagueId} week ${week}: ${err}`);
          errors++;
        }
      }
    }

    console.log(`Processed ${totalTrades} trades (${errors} fetch errors)`);

    // -----------------------------------------------------------------------
    // Apply signals to current snapshot
    // -----------------------------------------------------------------------
    const snapshot = await getOrCreateCurrentSnapshot();
    const updates: { playerId: number; value: number }[] = [];

    for (const [playerId, sig] of signals.entries()) {
      if (sig.count < MIN_TRADES_FOR_SIGNAL) continue;
      const current = valuesMap.get(playerId);
      if (!current) continue;

      const avg = sig.totalAdjustment / sig.count;
      const clamped = Math.max(-MAX_NUDGE_PER_RUN, Math.min(MAX_NUDGE_PER_RUN, avg));
      const next = Math.max(1, Math.min(99, Math.round(current + clamped)));
      if (next !== current) updates.push({ playerId, value: next });
    }

    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map(({ playerId, value }) =>
          prisma.playerValue.upsert({
            where: {
              playerId_snapshotId_source_format: {
                playerId,
                snapshotId: snapshot.id,
                source: "sleeper",
                format: SLEEPER_FORMAT,
              },
            },
            update: { value },
            create: {
              playerId,
              snapshotId: snapshot.id,
              source: "sleeper",
              format: SLEEPER_FORMAT,
              value,
            },
          }),
        ),
      );
    }

    const summary = `Processed ${totalTrades} trades from ${leagueIds.length} league(s). Adjusted ${updates.length} player value(s).`;
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
