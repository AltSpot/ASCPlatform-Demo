-- Reported marks per position, per period. Subscription.currentValue is
-- the latest of these, kept denormalised so list reads need no join.
CREATE TABLE "position_marks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "asOf" DATETIME NOT NULL,
    "value" INTEGER NOT NULL,
    "basis" TEXT NOT NULL DEFAULT 'vehicle',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "position_marks_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "position_marks_subscriptionId_idx" ON "position_marks"("subscriptionId");
CREATE UNIQUE INDEX "position_marks_subscriptionId_asOf_key" ON "position_marks"("subscriptionId", "asOf");
