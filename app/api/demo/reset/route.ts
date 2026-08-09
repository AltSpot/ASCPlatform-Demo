/**
 * POST /api/demo/reset
 *
 * Wipes THIS investor's data and signs them out — account, onboarding,
 * profiles, commitments and documents — then hands back any allocation
 * their signed commitments were holding, so the marketplace returns to
 * its seeded state. Other investors are untouched.
 *
 * DEMO SEAM — this whole route is demo-only and refuses when DEMO_MODE is
 * off. Destroying an investor's books and records on request is not a
 * production capability: a real deployment retains them, and the closest
 * legitimate operation is a supervised account closure that keeps the
 * audit trail. Delete this route rather than adapting it.
 */
import { audit } from '@/lib/audit';
import { destroySession, getSessionUser } from '@/lib/auth';
import { DEMO_MODE } from '@/lib/config';
import { ok, route, ValidationError } from '@/lib/http';
import { deleteInvestor, releaseHeldAllocation } from '@/lib/repositories/demo';

export const POST = route(async () => {
  if (!DEMO_MODE) {
    throw new ValidationError('Demo reset is disabled outside demo mode');
  }

  const user = await getSessionUser();
  if (!user) return ok({ ok: true });

  // Return allocation held by signed-but-unfunded commitments.
  await releaseHeldAllocation(user.id);

  await audit({ userId: user.id, action: 'demo.reset', entity: 'user', entityId: user.id });

  await destroySession();
  await deleteInvestor(user.id);

  return ok({ ok: true });
});
