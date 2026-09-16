/**
 * PUT    /api/watchlist/:dealId — save a deal.
 * DELETE /api/watchlist/:dealId — unsave it.
 *
 * Both are idempotent, so a double click or a retry lands in the state
 * the investor asked for rather than an error. The audit line is written
 * only when something actually changed.
 *
 * Saving is gated like reading. Before the 506(b) relationship gate opens
 * a member has been shown no offering to save, and a save that answered
 * "found" or "not found" for a guessed id would confirm which offerings
 * exist. Unsaving is never gated.
 */
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import { ForbiddenError, NotFoundError, ok, route } from '@/lib/http';
import { getDealAccess } from '@/lib/repositories/deals';
import { addToWatchlist, listWatchlist, removeFromWatchlist } from '@/lib/repositories/watchlist';

type Context = { params: Promise<{ dealId: string }> };

export const PUT = route(async (_request: Request, context: Context) => {
  const user = await requireUser();
  const { dealId } = await context.params;

  const access = await getDealAccess(dealId, user.id);
  if (access?.access === 'locked') {
    throw new ForbiddenError('Offerings open once your investor questionnaire is approved.');
  }
  if (!access) throw new NotFoundError('Deal not found');

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
