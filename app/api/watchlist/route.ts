/** GET /api/watchlist — the deal ids this investor has saved, newest first. */
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/http';
import { listWatchlist } from '@/lib/repositories/watchlist';

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await listWatchlist(user.id));
});
