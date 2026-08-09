/**
 * PUT    /api/watchlist/:dealId — save a deal.
 * DELETE /api/watchlist/:dealId — unsave it.
 *
 * Both are idempotent, so a double click or a retry lands in the state
 * the investor asked for rather than an error. The audit line is written
 * only when something actually changed.
 *
 * Not gated on accreditation: saving a deal is not reading one. A member
 * still finishing setup can keep a list, and the dashboard block then
 * shows them the same teaser the marketplace does.
 */
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import { NotFoundError, ok, route } from '@/lib/http';
import { dealExists } from '@/lib/repositories/deals';
import { addToWatchlist, listWatchlist, removeFromWatchlist } from '@/lib/repositories/watchlist';

type Context = { params: Promise<{ dealId: string }> };

export const PUT = route(async (_request: Request, context: Context) => {
  const user = await requireUser();
  const { dealId } = await context.params;

  if (!(await dealExists(dealId))) throw new NotFoundError('Deal not found');

  if (await addToWatchlist(user.id, dealId)) {
    await audit({
      userId: user.id,
      action: 'watchlist.added',
      entity: 'watchlist_item',
      entityId: dealId,
    });
  }

  return ok({ dealId, watched: true, watchlist: await listWatchlist(user.id) });
});

export const DELETE = route(async (_request: Request, context: Context) => {
  const user = await requireUser();
  const { dealId } = await context.params;

  if (await removeFromWatchlist(user.id, dealId)) {
    await audit({
      userId: user.id,
      action: 'watchlist.removed',
      entity: 'watchlist_item',
      entityId: dealId,
    });
  }

  return ok({ dealId, watched: false, watchlist: await listWatchlist(user.id) });
});
