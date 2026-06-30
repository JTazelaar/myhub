-- Baseline migration: represents the schema that already exists in production
-- before Prisma migration tracking was introduced.
-- This file is never executed against the DB; it is marked applied via
-- `prisma migrate resolve --applied` so that only newer migrations run.

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "team" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_aliases" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    CONSTRAINT "player_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_snapshots" (
    "id" SERIAL NOT NULL,
    "season" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ranking_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_values" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "snapshotId" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "player_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matchup_votes" (
    "id" SERIAL NOT NULL,
    "playerAId" INTEGER NOT NULL,
    "playerBId" INTEGER NOT NULL,
    "winnerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "matchup_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_runs" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    CONSTRAINT "import_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_name_key" ON "players"("name");

-- CreateIndex
CREATE UNIQUE INDEX "player_aliases_playerId_alias_key" ON "player_aliases"("playerId", "alias");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_snapshots_season_week_key" ON "ranking_snapshots"("season", "week");

-- CreateIndex
CREATE UNIQUE INDEX "player_values_playerId_snapshotId_key" ON "player_values"("playerId", "snapshotId");

-- AddForeignKey
ALTER TABLE "player_aliases" ADD CONSTRAINT "player_aliases_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_values" ADD CONSTRAINT "player_values_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_values" ADD CONSTRAINT "player_values_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ranking_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchup_votes" ADD CONSTRAINT "matchup_votes_playerAId_fkey" FOREIGN KEY ("playerAId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchup_votes" ADD CONSTRAINT "matchup_votes_playerBId_fkey" FOREIGN KEY ("playerBId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchup_votes" ADD CONSTRAINT "matchup_votes_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
