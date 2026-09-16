-- Rule 506(b) per-deal eligibility (work order screen 2).
--
-- A member may subscribe only to deals launched after their relationship
-- was established. Existing deals take their creation time as the launch
-- date; the seed then sets real, staggered launch dates.

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
    "assetClass" TEXT NOT NULL DEFAULT 'venture',
    "industry" TEXT,
    "art" TEXT NOT NULL,
    "blurb" TEXT NOT NULL,
    "risks" TEXT NOT NULL,
    "minInvestment" INTEGER NOT NULL,
    "allocationTotal" INTEGER NOT NULL,
    "allocationRemaining" INTEGER NOT NULL,
    "targetClose" TEXT NOT NULL,
    "launchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "altspotCommitted" INTEGER NOT NULL,
    "committedNote" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "logoUrl" TEXT,
    "videoUrl" TEXT,
    "headline" TEXT,
    "summary" TEXT,
    "pricePerShare" TEXT,
    "thesisJson" TEXT NOT NULL,
    "feesJson" TEXT NOT NULL,
    "mediaJson" TEXT NOT NULL,
    "chartsJson" TEXT,
    "docsJson" TEXT NOT NULL,
    "spotbotJson" TEXT NOT NULL,
    "deckJson" TEXT NOT NULL,
    "metricsJson" TEXT NOT NULL DEFAULT '[]',
    "termsJson" TEXT NOT NULL DEFAULT '[]',
    "preferredTermsJson" TEXT NOT NULL DEFAULT '[]',
    "whatWeLikeJson" TEXT NOT NULL DEFAULT '[]',
    "outcomesJson" TEXT NOT NULL DEFAULT '{}',
    "indicatorsJson" TEXT NOT NULL DEFAULT '{}',
    "roundsJson" TEXT NOT NULL DEFAULT '[]',
    "backingJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_deals" ("launchedAt", "allocationRemaining", "allocationTotal", "altspotCommitted", "art", "assetClass", "backingJson", "blurb", "chartsJson", "committedNote", "createdAt", "deckJson", "docsJson", "entity", "feesJson", "headline", "id", "indicatorsJson", "industry", "kind", "logoUrl", "mediaJson", "metricsJson", "minInvestment", "name", "outcomesJson", "preferredTermsJson", "pricePerShare", "risks", "roundsJson", "sector", "sortOrder", "spotbotJson", "stage", "status", "summary", "tag", "targetClose", "termsJson", "thesisJson", "updatedAt", "videoUrl", "whatWeLikeJson") SELECT "createdAt", "allocationRemaining", "allocationTotal", "altspotCommitted", "art", "assetClass", "backingJson", "blurb", "chartsJson", "committedNote", "createdAt", "deckJson", "docsJson", "entity", "feesJson", "headline", "id", "indicatorsJson", "industry", "kind", "logoUrl", "mediaJson", "metricsJson", "minInvestment", "name", "outcomesJson", "preferredTermsJson", "pricePerShare", "risks", "roundsJson", "sector", "sortOrder", "spotbotJson", "stage", "status", "summary", "tag", "targetClose", "termsJson", "thesisJson", "updatedAt", "videoUrl", "whatWeLikeJson" FROM "deals";
DROP TABLE "deals";
ALTER TABLE "new_deals" RENAME TO "deals";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

