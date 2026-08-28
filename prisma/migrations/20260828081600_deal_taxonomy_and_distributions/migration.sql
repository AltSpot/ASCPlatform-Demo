-- CreateTable
CREATE TABLE "distributions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAt" DATETIME NOT NULL,
    "kind" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "distributions_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "distributions_subscriptionId_idx" ON "distributions"("subscriptionId");
