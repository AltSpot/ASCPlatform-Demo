/**
 * Watchlist repository — the only place that touches watchlist_items.
 *
 * An investor's own saved deals. Private to them, and inert: saving a
 * deal reserves no allocation, tells the issuer nothing and is not an
 * indication of interest. That is what separates it from AltSpot Radar,
 * which is a public demand signal and is never called a watchlist.
 *
 * Every function is scoped to the session user, so one investor can
 * neither read nor change another's list.
 */
import 'server-only';

import { prisma } from '../db';

/** Deal ids this investor has saved, newest first. */
export async function listWatchlist(userId: string): Promise<string[]> {
  const rows = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { dealId: true },
  });
  return rows.map((row) => row.dealId);
}

/**
 * Save a deal. Idempotent: saving one already saved is a no-op rather
 * than a duplicate row or an error, so a double click cannot fail.
 * Returns true when the list actually changed, which is what the caller
 * audits on.
 */
export async function addToWatchlist(
  userId: string,
  dealId: string,
): Promise<boolean> {
  const existing = await prisma.watchlistItem.findUnique({
    where: { userId_dealId: { userId, dealId } },
    select: { id: true },
  });
  if (existing) return false;

  await prisma.watchlistItem.create({ data: { userId, dealId } });
  return true;
}

/** Remove a deal. Idempotent in the same way. */
export async function removeFromWatchlist(
  userId: string,
  dealId: string,
): Promise<boolean> {
  const { count } = await prisma.watchlistItem.deleteMany({
    where: { userId, dealId },
  });
  return count > 0;
}
