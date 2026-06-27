# Fantasy Trade Calculator

A small Next.js app for tracking fantasy football player trade values over time, voting on
player-vs-player matchups to help tune those values, and comparing two-sided trades.

See [`docs/PRODUCT.md`](docs/PRODUCT.md) for the product goal, [`docs/DB_SCHEMA.md`](docs/DB_SCHEMA.md)
for the data model, [`docs/ROADMAP.md`](docs/ROADMAP.md) for what's built vs. planned, and
[`docs/CONTEXT.md`](docs/CONTEXT.md) for a log of notable decisions made along the way.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) with the `pg` driver adapter
- PostgreSQL (local Postgres for development, [Supabase](https://supabase.com) in production)
- Deployed on [Vercel](https://vercel.com)

## Local setup

1. Create a Postgres database and set `DATABASE_URL` in a `.env` file at the project root:
   ```
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Push the schema to your database:
   ```bash
   npx prisma db push
   ```
4. Seed some sample players and values:
   ```bash
   npx prisma db seed
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Pages

- `/` — home
- `/calculator` — build two trade sides and see who wins
- `/vote` — vote on random player-vs-player matchups
- `/admin` — add players and edit current trade values
- `/admin/snapshots` — view ranking history and start a new week

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build (also runs the TypeScript check)
- `npm run lint` — ESLint
- `npx prisma db seed` — re-run the seed script
