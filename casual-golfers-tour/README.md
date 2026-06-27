# ⛳ Casual Golfers Tour

A fun, colorful season tracker for a 12-person golf tour: 6 events a year (five 18-hole
events, one 36-hole event), 2 teams of 6, manually-scored foursomes, and a season-long
leaderboard built from admin-entered points.

## Tech stack

- **Client**: React 19 + TypeScript + Vite + Tailwind CSS, React Router v7
- **Server**: Node.js + Express, SQLite via `better-sqlite3`, `express-session` for admin auth
- **Dev tooling**: `concurrently` runs both processes with a single command

## Getting started

```bash
npm run install:all   # installs server + client dependencies
cp .env.example .env   # then edit ADMIN_PASSWORD/SESSION_SECRET if you want
npm run dev            # starts the API on :4000 and the Vite client on :5173
```

Open http://localhost:5173 for the public site. The admin dashboard is at
http://localhost:5173/admin (password from `ADMIN_PASSWORD` in `.env`, default `changeme`
in `.env.example`).

The SQLite database lives at `server/db/casual-golfers-tour.sqlite` and is created and
seeded automatically the first time the server starts (12 players, one fully-played
completed event, one upcoming event). Seeding is idempotent — it only runs when the
`players` table is empty, so it won't overwrite real data on subsequent starts.

### Production build

```bash
npm run build              # builds the client into client/dist
npm start --prefix server  # serves the API and the built client together
```

## How the tour works

- **Players**: 12 friends, each with a name, optional nickname, handicap, and a team
  (A or B). Team assignments live in Season Settings and can be changed at the start of
  a new season.
- **Events**: each event has a date, course, number of holes (18 or 36), and a toggle
  for whether handicaps apply. Status moves automatically as the admin works through
  the event: `upcoming` → `in_progress` (as soon as any score is saved) → `completed`
  (once final points are saved).
- **Segments**: every event is split into 9-hole segments (Front 9 / Back 9, or all four
  for a 36-hole event). Segments are auto-suggested from the hole count and created in
  one batch; after that they can only be renamed or deleted, not added to, since
  foursomes and scores are built per-segment.
- **Foursomes**: each segment is divided into foursomes of 2-vs-2 cross-team matchups.
  Each foursome picks a format:
  - **Scramble** / **Alternate Shot** — the 4 players post a single group score.
  - **Best Ball** / **1v1 Stroke Play** — each player posts their own score; 1v1 also
    tracks a specific opponent for head-to-head bragging rights.
- **Scores & handicaps**: when handicaps are enabled for an event, net score is
  computed as gross minus half the player's handicap (since segments are 9 holes). For
  group formats, the same formula uses the average handicap of the foursome's 4 players.
- **Points**: nothing is auto-scored. After a round, the admin manually enters each
  player's placement, points, and an optional note for the event. Saving points is what
  marks the event `completed`. The season leaderboard is just the sum of those points.

## Project layout

```
casual-golfers-tour/
├── server/             Express API + SQLite
│   ├── db/             schema, db connection, seed data
│   ├── routes/         auth, players, season, events, segments, foursomes, leaderboard
│   └── utils/          handicap math + event/foursome summarization
└── client/             React + TS + Tailwind app
    └── src/
        ├── pages/      public pages + admin dashboard & event wizard
        ├── components/ shared UI (cards, badges, empty/loading states)
        └── api/        typed fetch client
```

## Notes on a few judgment calls

- **Segments are created once.** The bulk-create endpoint refuses to run again once an
  event has segments, so the UI shows an editable "suggested segments" draft only
  before creation, then switches to a rename/delete view.
- **`partner_player_id`** is only meaningful for the matchup formats (Best Ball, 1v1) —
  it records the specific player on the other team that a player is matched against. For
  the group formats it's `null`, since all 4 players in a Scramble/Alternate Shot
  foursome share one score with no inherent pairing.
- **Final points entries always list all 12 players**, sorted alphabetically by name
  (not by live placement input), so the table doesn't reorder while the admin is mid-edit.
