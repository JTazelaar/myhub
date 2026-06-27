# Database schema

Defined in [`prisma/schema.prisma`](../prisma/schema.prisma). Table names are snake_case in
Postgres (via `@@map`); fields stay camelCase in Prisma/TypeScript.

## `players`

One row per player. `name` is unique. `isActive` lets a player be hidden from voting/calculator
without deleting their history.

| field      | type    | notes                          |
| ---------- | ------- | ------------------------------ |
| id         | Int     | PK                              |
| name       | String  | unique                          |
| position   | String  | e.g. "RB", "WR"                 |
| team       | String? | optional                        |
| isActive   | Boolean | default true                    |
| createdAt  | DateTime|                                  |
| updatedAt  | DateTime|                                  |

## `player_aliases`

Alternate names for a player (e.g. nicknames, old spellings), for future import/matching. Not yet
used by any feature — reserved for when player data import from an external source is added.

| field    | type   | notes                          |
| -------- | ------ | ------------------------------ |
| id       | Int    | PK                              |
| playerId | Int    | FK -> players                   |
| alias    | String | unique per player               |

## `ranking_snapshots`

One row per "week" of values. Never edited after the fact in spirit — new values go in a new
snapshot, not by mutating an old one. `season` + `week` is unique.

| field     | type     | notes                                |
| --------- | -------- | ------------------------------------- |
| id        | Int      | PK                                    |
| season    | Int      |                                        |
| week      | Int      |                                        |
| label     | String   | human-readable, e.g. "2026 Week 2"     |
| notes     | String?  | optional                              |
| createdAt | DateTime |                                        |

## `player_values`

A player's value within one snapshot. `playerId` + `snapshotId` is unique, so each player has at
most one value per week. The "latest" snapshot's values are what the calculator and voting pages
use as the current values.

| field      | type     | notes                          |
| ---------- | -------- | ------------------------------ |
| id         | Int      | PK                              |
| playerId   | Int      | FK -> players                   |
| snapshotId | Int      | FK -> ranking_snapshots          |
| value      | Int      | 1-100                           |
| createdAt  | DateTime |                                  |

## `matchup_votes`

One row per vote cast on `/vote`. Stores both players shown and which one the voter picked, so the
full pairing history is preserved (not just a running tally).

| field     | type     | notes                          |
| --------- | -------- | ------------------------------ |
| id        | Int      | PK                              |
| playerAId | Int      | FK -> players                   |
| playerBId | Int      | FK -> players                   |
| winnerId  | Int      | FK -> players, must be A or B   |
| createdAt | DateTime |                                  |

## `import_runs`

Reserved for a future bulk-import feature (e.g. pulling real rankings from an external source).
Not yet written to by any code.

| field      | type      | notes                          |
| ---------- | --------- | ------------------------------ |
| id         | Int       | PK                              |
| source     | String    | e.g. "manual", "csv"            |
| status     | String    | e.g. "success", "failed"        |
| summary    | String?   | optional                        |
| startedAt  | DateTime  |                                  |
| finishedAt | DateTime? | null while still running        |
