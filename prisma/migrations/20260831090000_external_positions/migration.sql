-- Holdings the member has elsewhere. Self-reported: every figure here
-- is whatever they typed, and no AltSpot mark stands behind any of it.
CREATE TABLE "external_positions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "custodian" TEXT,
    "assetClass" TEXT NOT NULL,
    "industry" TEXT,
    "invested" INTEGER NOT NULL,
    "fairValue" INTEGER NOT NULL DEFAULT 0,
    "realized" INTEGER NOT NULL DEFAULT 0,
    "investedAt" DATETIME NOT NULL,
    "markedAt" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "external_positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "external_positions_userId_idx" ON "external_positions"("userId");
