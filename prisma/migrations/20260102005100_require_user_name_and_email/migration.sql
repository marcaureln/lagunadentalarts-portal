/*
  Warnings:

  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/

UPDATE "User"
SET "email" = CONCAT('unknown+', "id", '@invalid.local')
WHERE "email" IS NULL OR BTRIM("email") = '';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;
