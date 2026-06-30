#!/usr/bin/env tsx
/**
 * Looks up all NFL leagues for a Sleeper username and prints them in a format
 * ready to paste into your .env file.
 *
 * Usage:
 *   npx tsx scripts/find-sleeper-leagues.ts <sleeper-username>
 *
 * Example:
 *   npx tsx scripts/find-sleeper-leagues.ts john_doe
 */

const SLEEPER_BASE = "https://api.sleeper.app/v1";
const CURRENT_YEAR = new Date().getFullYear();

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": "fantasy-trade-calculator/1.0" },
  });
  if (!res.ok) throw new Error(`Sleeper API ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

type SleeperUser = { user_id: string; display_name: string };
type SleeperLeague = {
  league_id: string;
  name: string;
  season: string;
  total_rosters: number;
  status: string;
};

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.error("Usage: npx tsx scripts/find-sleeper-leagues.ts <sleeper-username>");
    process.exit(1);
  }

  console.log(`Looking up user "${username}"...`);
  const user = await fetchJson<SleeperUser | null>(`${SLEEPER_BASE}/user/${username}`);
  if (!user) {
    console.error(`User "${username}" not found on Sleeper.`);
    process.exit(1);
  }
  console.log(`Found: ${user.display_name} (ID: ${user.user_id})\n`);

  const leagues = await fetchJson<SleeperLeague[]>(
    `${SLEEPER_BASE}/user/${user.user_id}/leagues/nfl/${CURRENT_YEAR}`,
  );

  if (!leagues || leagues.length === 0) {
    console.log(`No leagues found for ${CURRENT_YEAR}.`);
    return;
  }

  console.log(`Found ${leagues.length} league(s) for ${CURRENT_YEAR}:\n`);
  for (const league of leagues) {
    console.log(`  ${league.name}`);
    console.log(`    ID:      ${league.league_id}`);
    console.log(`    Teams:   ${league.total_rosters}`);
    console.log(`    Status:  ${league.status}`);
    console.log();
  }

  const ids = leagues.map((l) => l.league_id).join(",");
  console.log("Add this to your .env (or Vercel / GitHub Actions secrets):");
  console.log(`  SLEEPER_LEAGUE_IDS=${ids}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
