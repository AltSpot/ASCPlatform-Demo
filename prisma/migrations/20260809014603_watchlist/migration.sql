-- CreateTable
CREATE TABLE "watchlist_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "watchlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "watchlist_items_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "watchlist_items_userId_idx" ON "watchlist_items"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_items_userId_dealId_key" ON "watchlist_items"("userId", "dealId");
