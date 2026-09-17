-- Deal preferences for matchmaking.
CREATE TABLE "investor_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "showEverything" BOOLEAN NOT NULL DEFAULT false,
    "assetClassesJson" TEXT NOT NULL DEFAULT '[]',
    "industriesJson" TEXT NOT NULL DEFAULT '[]',
    "stagesJson" TEXT NOT NULL DEFAULT '[]',
    "leadsJson" TEXT NOT NULL DEFAULT '[]',
    "checkSize" TEXT,
    "notifyMatches" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "investor_preferences_userId_key" ON "investor_preferences"("userId");
