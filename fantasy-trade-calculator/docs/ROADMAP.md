# Roadmap

## V1 — done

- [x] Next.js + TypeScript + Tailwind + Prisma + Postgres project scaffolded
- [x] Schema for players, aliases, snapshots, values, votes, import runs
- [x] Seed script with sample players and an initial snapshot
- [x] Home, calculator, vote pages (public)
- [x] Admin pages: add/edit players and values, view/create snapshots (no auth)
- [x] Non-linear trade value formula (`lib/trades/value.ts`)
- [x] Full ranking history preserved via snapshots

## Next up

- [ ] Deploy to Vercel + Supabase, confirm production build works against a real driver-adapter
      Postgres connection
- [ ] Basic admin auth (see `AdminNotice` banner — admin pages are currently unprotected)
- [ ] Use `matchup_votes` data to suggest or auto-adjust player values instead of relying purely on
      manual admin edits
- [ ] Player search/filter on `/admin` and `/calculator` once the player list grows past a quick
      scroll
- [ ] Tune `TRADE_VALUE_EXPONENT` (and/or the formula shape) once real trade outcomes can be
      sanity-checked against it

## Deliberately deferred (not V1)

- Real player data import (`import_runs` table exists but nothing writes to it yet)
- Player aliases / fuzzy name matching (`player_aliases` table exists but is unused)
- Multi-league support, multi-user accounts
- Mobile app (the web app is responsive instead)
