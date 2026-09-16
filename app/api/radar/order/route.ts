/**
 * PATCH /api/radar/order — the member's own ordering for Your Radar.
 *
 * A display preference and nothing more. It moves no money, changes no
 * indication and is invisible to every other member. The client
 * reorders optimistically because dragging has to feel immediate; this
 * is the authority on what is actually stored.
 *
 * Ownership is not a parameter. The order applies to the session's own
 * indications, so a slug this member has not indicated on is silently
 * ignored rather than creating a row.
 */
import { requireUser } from '@/lib/auth';
import { ok, readJson, route, ValidationError } from '@/lib/http';
import { reorderRadar } from '@/lib/repositories/radar';
import { findRadarCompany } from '@/lib/terminal/radar';

export const PATCH = route(async (request: Request) => {
  const user = await requireUser();
  const body = await readJson<{ order?: unknown }>(request);

  if (!Array.isArray(body.order)) {
    throw new ValidationError('"order" must be an array of company slugs');
  }

  const seen = new Set<string>();
  const order: string[] = [];

  for (const value of body.order) {
    if (typeof value !== 'string') {
      throw new ValidationError('"order" must contain company slugs');
    }
    // The tracked-company list is the allowlist, same rule as indicating.
    if (!findRadarCompany(value)) {
      throw new ValidationError('That company is not on the Radar');
    }
    // A repeated slug would make the stored sequence ambiguous.
    if (seen.has(value)) {
      throw new ValidationError('"order" must not repeat a company');
    }
    seen.add(value);
    order.push(value);
  }

  /* Deliberately not audited. The audit trail is for anything that
     would need books-and-records treatment, and how a member sorts
     their own dashboard is not that. Indicating IS audited, in
     app/api/radar/interest/route.ts, because the amount is the part
     that carries meaning. */
  return ok(await reorderRadar(user.id, order));
});
