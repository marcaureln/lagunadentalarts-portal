-- Rename "pfp" -> "avatarUrl" while preserving existing values.
ALTER TABLE "User" RENAME COLUMN "pfp" TO "avatarUrl";
