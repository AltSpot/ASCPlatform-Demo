/**
 * GET /api/subscriptions/resumable?dealId=… — the in-progress commitment
 * for a deal, if there is one. Drives the "Resume investment" affordance.
 */
import { requireUser } from '@/lib/auth';
import { ok, route, ValidationError } from '@/lib/http';
import { getResumable } from '@/lib/repositories/subscriptions';

export const GET = route(async (request: Request) => {
  const user = await requireUser();

  const dealId = new URL(request.url).searchParams.get('dealId');
  if (!dealId) throw new ValidationError('"dealId" is required');

  return ok(await getResumable(user.id, dealId));
});
