-- Add college and sleeperId to players
ALTER TABLE "players" ADD COLUMN "college" TEXT;
ALTER TABLE "players" ADD COLUMN "sleeperId" TEXT;

-- Add format to matchup_votes (existing rows default to halfppr_1qb)
ALTER TABLE "matchup_votes" ADD COLUMN "format" TEXT NOT NULL DEFAULT 'halfppr_1qb';

-- Create player_weekly_stats table
CREATE TABLE "player_weekly_stats" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "season" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "seasonType" TEXT NOT NULL DEFAULT 'regular',
    "ptsStd" REAL,
    "ptsHalfPpr" REAL,
    "ptsPpr" REAL,
    "passYd" INTEGER,
    "passTd" INTEGER,
    "passInt" INTEGER,
    "rushYd" INTEGER,
    "rushTd" INTEGER,
    "rec" INTEGER,
    "recYd" INTEGER,
    "recTd" INTEGER,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "player_weekly_stats_pkey" PRIMARY KEY ("id")
);

-- Foreign key
ALTER TABLE "player_weekly_stats"
    ADD CONSTRAINT "player_weekly_stats_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique constraint
CREATE UNIQUE INDEX "player_weekly_stats_playerId_season_week_seasonType_key"
    ON "player_weekly_stats"("playerId", "season", "week", "seasonType");
