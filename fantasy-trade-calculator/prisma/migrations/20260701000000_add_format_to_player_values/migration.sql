-- Add format column; existing automated import rows default to "ppr_1qb"
-- (the format that was imported before multi-format support), and manual
-- overrides get "all" so they apply across every format context.
ALTER TABLE "player_values" ADD COLUMN "format" TEXT NOT NULL DEFAULT 'ppr_1qb';

-- Manual overrides should apply regardless of format.
UPDATE "player_values" SET "format" = 'all' WHERE "source" = 'manual';

-- Drop the old three-column unique constraint.
ALTER TABLE "player_values" DROP CONSTRAINT IF EXISTS "player_values_playerId_snapshotId_source_key";

-- Add the new four-column unique constraint.
ALTER TABLE "player_values" ADD CONSTRAINT "player_values_playerId_snapshotId_source_format_key"
  UNIQUE ("playerId", "snapshotId", "source", "format");

-- Remove the column default — the app now always provides the format explicitly.
ALTER TABLE "player_values" ALTER COLUMN "format" DROP DEFAULT;
