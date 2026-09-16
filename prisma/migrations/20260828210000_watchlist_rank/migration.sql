-- The investor's own ordering for their watchlist. Zero means unranked,
-- which falls back to newest first at read time.
ALTER TABLE "watchlist_items" ADD COLUMN "rank" INTEGER NOT NULL DEFAULT 0;
