-- Illustrative return scenarios: the set on a deal, and the record of
-- what each member was shown.
ALTER TABLE "deals" ADD COLUMN "scenariosJson" TEXT NOT NULL DEFAULT '{}';

CREATE TABLE "scenario_views" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "assumptionsJson" TEXT NOT NULL,
    "firstShownAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastShownAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timesShown" INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX "scenario_views_userId_dealId_version_key" ON "scenario_views"("userId", "dealId", "version");
CREATE INDEX "scenario_views_dealId_idx" ON "scenario_views"("dealId");
