/**
 * POST /api/demo/reset
 *
 * Wipes THIS investor's data and signs them out — account, onboarding,
 * profiles, commitments and documents — then hands back any allocation
 * their signed commitments were holding, so the marketplace returns to
 * its seeded state. Other investors are untouched.
 *
 * Refuses outside demo mode: this is not a production capability.
 */
import { audit } from '@/lib/audit';
import { destroySession, getSessionUser } from '@/lib/auth';
import { DEMO_MODE } from '@/lib/config';
import { prisma } from '@/lib/db';
import { ok, route, ValidationError } from '@/lib/http';

export const POST = route(async () => {
  if (!DEMO_MODE) {
    throw new ValidationError('Demo reset is disabled outside demo mode');
  }

  const user = await getSessionUser();
  if (!user) return ok({ ok: true });

  // Return allocation held by signed-but-unfunded commitments.
  const reserved = await prisma.subscription.findMany({
    where: { userId: user.id, state: 'docs_signed' },
  });
  for (const row of reserved) {
    await prisma.deal.update({
      where: { id: row.dealId },
      data: { allocationRemaining: { increment: row.amount } },
    });
  }

  await audit({ userId: user.id, action: 'demo.reset', entity: 'user', entityId: user.id });

  await destroySession();
  // Cascades clear sessions, onboarding, profiles, subscriptions and docs.
  await prisma.user.delete({ where: { id: user.id } });

  return ok({ ok: true });
});
