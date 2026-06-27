# Context & decisions log

Notes on choices made while building this that aren't obvious from the code alone.

## Project location

This app lives in `fantasy-trade-calculator/` at the root of the `myhub` repo, as a sibling to the
existing `backend/` Django app, rather than in its own repo. The GitHub access and feature branch
for this work were scoped to this repo specifically.

## Prisma 7 uses driver adapters, not a schema URL

Prisma 7 removed the `url = env(...)` line from `schema.prisma`'s `datasource` block. Connection
config now lives in `prisma.config.ts` (for the CLI — `db push`, `migrate`, seeding), and the
runtime `PrismaClient` is constructed with a driver adapter (`@prisma/adapter-pg` + `pg`) instead
of reading the schema's URL directly. See `lib/db/prisma.ts` and `prisma.config.ts`. This also
means `prisma.config.ts` and `prisma/seed.ts` both need `import "dotenv/config"` as their first
line — the CLI doesn't auto-load `.env` before evaluating them.

This pattern is also what's needed for serverless/edge deploys (e.g. Vercel + Supabase), so it's
the right shape for where this app is headed anyway.

## No admin auth in V1

`/admin` and `/admin/snapshots` have no login. This was a deliberate "keep V1 simple" call — the
`AdminNotice` banner on both pages exists specifically to keep this visible so it doesn't get
forgotten before the app is shared beyond local use. Auth is the first item under "Next up" in
`ROADMAP.md`.

## Snapshots: auto-create on first edit, explicit "new week" otherwise

`setPlayerValue` (used by the `/admin` players page) will create a default snapshot automatically
if none exists yet, so a brand-new install doesn't error out before any snapshot has been made.
Once a snapshot exists, starting a new week is always an explicit action
(`createNextSnapshot`, used by `/admin/snapshots`), which copies forward the previous week's
values so the new week doesn't start blank. Old snapshots are never edited or deleted by app code.

## Trade value formula is intentionally non-linear

Raw values are 1-100, but two 50s should not equal one 99. `lib/trades/value.ts` raises each
value to a power (`TRADE_VALUE_EXPONENT = 2`) before summing a trade side, so higher values count
disproportionately more. This is a single tunable constant by design — expect to adjust it (or the
formula shape) once real trade outcomes can be checked against it.

## All DB-backed pages are forced dynamic

`/calculator`, `/vote`, `/admin`, and `/admin/snapshots` each export
`export const dynamic = "force-dynamic"`. Without this, Next.js prerenders them as static pages at
build time — which is especially wrong for `/vote`, since the "random pair" would get baked in at
build time and never change. Forcing dynamic rendering keeps every page reading live data on every
request.
