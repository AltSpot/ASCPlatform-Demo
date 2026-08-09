-- CreateTable
CREATE TABLE "radar_interests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companySlug" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "radar_interests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "radar_interests_companySlug_idx" ON "radar_interests"("companySlug");

-- CreateIndex
CREATE UNIQUE INDEX "radar_interests_userId_companySlug_key" ON "radar_interests"("userId", "companySlug");
