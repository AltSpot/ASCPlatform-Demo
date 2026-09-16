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

/**
 * Deal ids this investor has saved, in their own order.
 *
 * Ranked rows first, in the order the investor dragged them, then
 * anything they have never touched, newest first. A list nobody has
 * reordered therefore reads exactly as it always did, which is what
 * lets the dragging be optional.
 */
export async function listWatchlist(userId: string): Promise<string[]> {
  const rows = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: [{ rank: 'asc' }, { createdAt: 'desc' }],
    select: { dealId: true, rank: true },
  });

  const ranked = rows.filter((row) => row.rank > 0);
  const rest = rows.filter((row) => row.rank === 0);
  return [...ranked, ...rest].map((row) => row.dealId);
}

/**
 * How many members have each deal saved, across the whole membership.
 *
 * The one read here that is not scoped to a user, and deliberately
 * so: it returns counts and never who. It feeds the dashboard's
 * "Most popular" (lib/popularity.ts), where attention from other
 * members is one of the three signals.
 */
export async function countWatchers(): Promise<Map<string, number>> {
  const rows = await prisma.watchlistItem.groupBy({
    by: ['dealId'],
    _count: { _all: true },
  });
  return new Map(rows.map((row) => [row.dealId, row._count._all]));
}

/**
 * Store the investor's own ordering.
 *
 * Ranks are rewritten from the submitted order rather than patched, so
 * the stored sequence is always 1..n with no gaps and no way for two
 * deals to tie. Ids the investor has not saved are ignored: a rank is a
 * property of a saved deal, so there is nothing to rank without one.
 */
export async function reorderWatchlist(
  userId: string,
  order: string[],
): Promise<string[]> {
  const saved = await prisma.watchlistItem.findMany({
    where: { userId },
    select: { dealId: true },
  });
  const held = new Set(saved.map((row) => row.dealId));

  const updates = order
    .filter((dealId) => held.has(dealId))
    .map((dealId, index) =>
      prisma.watchlistItem.update({
        where: { userId_dealId: { userId, dealId } },
        data: { rank: index + 1 },
      }),
    );

  if (updates.length > 0) await prisma.$transaction(updates);

  return listWatchlist(userId);
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
