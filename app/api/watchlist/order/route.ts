/**
 * PATCH /api/watchlist/order — the investor's own ordering.
 *
 * A display preference and nothing more. Saving a deal already reserves
 * nothing and tells the issuer nothing; the order it sits in reserves
 * even less. Deliberately not audited for the same reason the Radar
 * order is not: the audit trail is for anything that would need
 * books-and-records treatment, and how someone sorts their own list is
 * not that.
 *
 * Ownership is not a parameter. The order applies to the session's own
 * saved deals, so an id this investor has not saved is ignored rather
 * than creating a row.
 */
import { requireUser } from '@/lib/auth';
import { ok, readJson, route, ValidationError } from '@/lib/http';
import { reorderWatchlist } from '@/lib/repositories/watchlist';

export const PATCH = route(async (request: Request) => {
  const user = await requireUser();
  const body = await readJson<{ order?: unknown }>(request);

  if (!Array.isArray(body.order)) {
    throw new ValidationError('"order" must be an array of deal ids');
  }

  const seen = new Set<string>();
  const order: string[] = [];

  for (const value of body.order) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new ValidationError('"order" must contain deal ids');
    }
    // A repeated id would make the stored sequence ambiguous.
    if (seen.has(value)) {
      throw new ValidationError('"order" must not repeat a deal');
    }
    seen.add(value);
    order.push(value);
  }

  return ok(await reorderWatchlist(user.id, order));
});
