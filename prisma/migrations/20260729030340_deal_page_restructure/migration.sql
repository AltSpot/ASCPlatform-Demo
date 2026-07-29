-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_deals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "art" TEXT NOT NULL,
    "blurb" TEXT NOT NULL,
    "risks" TEXT NOT NULL,
    "minInvestment" INTEGER NOT NULL,
    "allocationTotal" INTEGER NOT NULL,
    "allocationRemaining" INTEGER NOT NULL,
    "targetClose" TEXT NOT NULL,
    "altspotCommitted" INTEGER NOT NULL,
    "committedNote" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "logoUrl" TEXT,
    "headline" TEXT,
    "summary" TEXT,
    "pricePerShare" TEXT,
    "thesisJson" TEXT NOT NULL,
    "feesJson" TEXT NOT NULL,
    "mediaJson" TEXT NOT NULL,
    "docsJson" TEXT NOT NULL,
    "spotbotJson" TEXT NOT NULL,
    "deckJson" TEXT NOT NULL,
    "metricsJson" TEXT NOT NULL DEFAULT '[]',
    "termsJson" TEXT NOT NULL DEFAULT '[]',
    "preferredTermsJson" TEXT NOT NULL DEFAULT '[]',
    "whatWeLikeJson" TEXT NOT NULL DEFAULT '[]',
    "outcomesJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_deals" ("allocationRemaining", "allocationTotal", "altspotCommitted", "art", "blurb", "committedNote", "createdAt", "deckJson", "docsJson", "entity", "feesJson", "headline", "id", "kind", "logoUrl", "mediaJson", "metricsJson", "minInvestment", "name", "risks", "sector", "sortOrder", "spotbotJson", "stage", "status", "tag", "targetClose", "termsJson", "thesisJson", "updatedAt") SELECT "allocationRemaining", "allocationTotal", "altspotCommitted", "art", "blurb", "committedNote", "createdAt", "deckJson", "docsJson", "entity", "feesJson", "headline", "id", "kind", "logoUrl", "mediaJson", "metricsJson", "minInvestment", "name", "risks", "sector", "sortOrder", "spotbotJson", "stage", "status", "tag", "targetClose", "termsJson", "thesisJson", "updatedAt" FROM "deals";
DROP TABLE "deals";
ALTER TABLE "new_deals" RENAME TO "deals";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
