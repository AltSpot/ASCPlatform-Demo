-- Referral links (work order screen 3). Reporting only: nothing in fee,
-- carry or eligibility logic reads users.referralCode or referralKind.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "users" ADD COLUMN "referralKind" TEXT;

-- CreateTable
CREATE TABLE "referral_codes" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "referral_codes_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_ownerUserId_key" ON "referral_codes"("ownerUserId");

