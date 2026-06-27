# Product

## Goal

Help a fantasy football league agree on whether a trade is fair by giving every player a single
trade value (1-100) that updates weekly, and letting two trade sides be compared automatically.

## Core ideas

- **Value is non-linear.** A 30 is barely roster-worthy, a 50 is a solid starter, a 99 is a true
  elite player. Two 50-value players should NOT add up to one 99-value player — a true elite
  player is worth more than the sum of two merely-good ones. The trade calculator's math
  (`lib/trades/value.ts`) reflects this directly: it's not just "add up the numbers."
- **History is never overwritten.** Every week's values live in their own `RankingSnapshot`. When
  values change, a new snapshot is created rather than mutating the old one, so we can always see
  what a player was worth in week 3 vs. week 8.
- **Voting helps calibrate values.** The `/vote` page asks "who would you rather have," one random
  pair at a time. In V1 this data is just collected (`matchup_votes`); a future version can use it
  to suggest value adjustments instead of relying purely on manual admin edits.

## Core flows

1. **Admin seeds/edits players** — add a player, give them a value. (`/admin`)
2. **Admin starts a new week** — create a new snapshot, which carries forward last week's values
   so nothing starts blank. (`/admin/snapshots`)
3. **Users vote** — pick who they'd rather have between two random players. (`/vote`)
4. **Users build a trade** — add players to each side, see who wins and by how much.
   (`/calculator`)

## V1 scope

Manual value entry by an admin, simple non-linear trade math, full ranking history, and matchup
voting (collected but not yet used to auto-adjust values). No authentication, no real player data
import, no mobile app — see `ROADMAP.md` for what's intentionally deferred.
