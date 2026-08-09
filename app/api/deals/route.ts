/**
 * GET /api/deals — the curated shelf.
 *
 * Redacted per viewer. A member who is not a verified accredited
 * investor receives the teaser only, so reading the JSON directly shows
 * exactly what the marketplace shows and nothing more.
 */
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/http';
import { listDealsForViewer } from '@/lib/repositories/deals';

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await listDealsForViewer(user.id));
});
