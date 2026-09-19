/**
 * GET /api/needs-you
 *
 * What is waiting on the member, for the bell. The bell sits in the portal
 * shell, which Next keeps mounted across navigation, so the list the shell
 * was rendered with goes stale the moment the member signs, sends to
 * escrow or votes. The bell re-reads this instead. Same builder as the
 * dashboard's strip (lib/needs-you.ts through lib/repositories/needs-you),
 * so the two cannot disagree about what counts.
 */
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/http';
import { listNeedsYou } from '@/lib/repositories/needs-you';

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await listNeedsYou(user.id));
});
