/**
 * GET /api/deals — the curated shelf.
 *
 * Gated per viewer. A member who has not cleared the 506(b) relationship
 * gate receives an empty list, so reading the JSON directly shows exactly
 * what the marketplace shows and nothing more.
 */
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/http';
import { listDealsForViewer } from '@/lib/repositories/deals';

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await listDealsForViewer(user.id));
});
