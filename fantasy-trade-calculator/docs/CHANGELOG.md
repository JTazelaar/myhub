# Changelog

## V1

- Scaffolded the Next.js + TypeScript + Tailwind project.
- Added Prisma schema: `players`, `player_aliases`, `ranking_snapshots`, `player_values`,
  `matchup_votes`, `import_runs`.
- Added `prisma/seed.ts` with 18 sample players and an initial snapshot.
- Added `lib/db`, `lib/players`, `lib/rankings`, `lib/trades`, `lib/votes` helper modules.
- Added public pages: home (`/`), trade calculator (`/calculator`), player voting (`/vote`).
- Added admin pages: players (`/admin`), ranking snapshots (`/admin/snapshots`) — no auth yet.
- Forced dynamic rendering on all DB-backed pages so they always read live data.
