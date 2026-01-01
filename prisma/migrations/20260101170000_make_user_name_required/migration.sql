-- Backfill any missing/blank names before enforcing NOT NULL
UPDATE "User"
SET "name" = COALESCE(NULLIF(BTRIM("name"), ''), NULLIF(SPLIT_PART("email", '@', 1), ''), 'User')
WHERE "name" IS NULL OR BTRIM("name") = '';

-- Enforce required name
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;
