-- The member's own ordering for Your Radar. Zero means unranked, which
-- falls back to demand order at read time.
ALTER TABLE "radar_interests" ADD COLUMN "rank" INTEGER NOT NULL DEFAULT 0;
