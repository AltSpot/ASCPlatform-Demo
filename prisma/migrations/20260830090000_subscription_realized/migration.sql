-- When a position exited. `closed` is the healthy terminal state of a
-- subscription (the deal closed and the investor is in it), so it could
-- never carry this meaning. Null while held.
ALTER TABLE "subscriptions" ADD COLUMN "realizedAt" DATETIME;
