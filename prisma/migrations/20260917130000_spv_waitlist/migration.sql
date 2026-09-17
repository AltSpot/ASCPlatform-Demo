-- Per-SPV investor cap waitlist (work order screen 13).
CREATE TABLE "spv_waitlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "amount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "spv_waitlist_userId_dealId_key" ON "spv_waitlist"("userId", "dealId");
CREATE INDEX "spv_waitlist_dealId_idx" ON "spv_waitlist"("dealId");
