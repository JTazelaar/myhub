-- Add source column; existing rows default to "fantasycalc" since that was
-- the only import source before this migration.
ALTER TABLE "player_values" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'fantasycalc';

-- Drop the old two-column unique constraint.
-- Note: if the constraint name differs in your Supabase instance, find the
-- actual name with:
--   SELECT conname FROM pg_constraint WHERE conrelid = 'player_values'::regclass;
ALTER TABLE "player_values" DROP CONSTRAINT IF EXISTS "player_values_playerId_snapshotId_key";

-- Add the new three-column unique constraint.
ALTER TABLE "player_values" ADD CONSTRAINT "player_values_playerId_snapshotId_source_key"
  UNIQUE ("playerId", "snapshotId", "source");

-- Remove the column default — the app now always provides the source explicitly.
ALTER TABLE "player_values" ALTER COLUMN "source" DROP DEFAULT;
