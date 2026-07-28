/**
 * POST /api/subscriptions/:id/fund
 *
 * Simulates the ACH transfer. Production hands off to the payments
 * provider and only moves to `funded` on settlement confirmation — the
 * state transition stays server-side for exactly that reason.
 */
import { requireUser } from '@/lib/auth';
import { NotFoundError, ok, readJson, requireString, route } from '@/lib/http';
import { prisma } from '@/lib/db';
import { getSubscription, fundSubscription } from '@/lib/repositories/subscriptions';

export const POST = route(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await context.params;

    const current = await getSubscription(user.id, id);
    if (!current) throw new NotFoundError('Subscription not found');

    const body = await readJson<{ method?: unknown }>(request);
    const method = requireString(body.method, 'method', { maxLength: 80 });

    const funded = await fundSubscription(user.id, id, method);

    // The filed agreement now reflects funding rather than awaiting it.
    await prisma.document.updateMany({
      where: { userId: user.id, subscriptionId: id, type: 'agreement' },
      data: { note: 'Signed · funded, awaiting countersign' },
    });

    return ok(funded);
  },
);
