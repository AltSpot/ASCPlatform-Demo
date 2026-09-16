-- Rule 506(b) relationship gate (docs/structure-decisions-sept-2026.md, section 15).
--
-- Accreditation moves from the 506(c) letter model (downloaded, pending,
-- verified, five-year expiry) to a self-certification questionnaire the
-- platform evaluates. Existing verified records carry forward as approved,
-- dated from their verification, and that date becomes the member's
-- relationship date. Letter-flow records in progress go back to
-- not_started: an uploaded letter is not a questionnaire.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "relationshipEstablishedAt" DATETIME;

UPDATE "users" SET "relationshipEstablishedAt" = (
    SELECT "verifiedAt" FROM "accreditations"
    WHERE "accreditations"."userId" = "users"."id" AND "accreditations"."status" = 'verified'
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_accreditations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "method" TEXT,
    "basis" TEXT,
    "answersJson" TEXT,
    "reason" TEXT,
    "submittedAt" DATETIME,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "accreditations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_accreditations" ("id", "userId", "status", "method", "submittedAt", "decidedAt", "createdAt", "updatedAt")
SELECT
    "id",
    "userId",
    CASE WHEN "status" = 'verified' THEN 'approved' ELSE 'not_started' END,
    CASE WHEN "status" = 'verified' THEN "method" ELSE NULL END,
    CASE WHEN "status" = 'verified' THEN "verifiedAt" ELSE NULL END,
    CASE WHEN "status" = 'verified' THEN "verifiedAt" ELSE NULL END,
    "createdAt",
    "updatedAt"
FROM "accreditations";
DROP TABLE "accreditations";
ALTER TABLE "new_accreditations" RENAME TO "accreditations";
CREATE UNIQUE INDEX "accreditations_userId_key" ON "accreditations"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
