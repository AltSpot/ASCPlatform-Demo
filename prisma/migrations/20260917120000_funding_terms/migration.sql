-- Funding terms per SPV (work order screens 5, 12 and 13).
--
-- minimumToClose: what the SPV must raise into escrow to close.
-- leadType: 'altspot' or 'partner'.
-- investorCap: most members the SPV may admit (100 default, 250 max).
ALTER TABLE "deals" ADD COLUMN "minimumToClose" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "deals" ADD COLUMN "leadType" TEXT NOT NULL DEFAULT 'altspot';
ALTER TABLE "deals" ADD COLUMN "investorCap" INTEGER NOT NULL DEFAULT 100;
