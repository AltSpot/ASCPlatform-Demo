/** GET /api/deals — the curated shelf. Requires an approved member. */
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/http';
import { listDeals } from '@/lib/repositories/deals';

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await listDeals(user.id));
});
