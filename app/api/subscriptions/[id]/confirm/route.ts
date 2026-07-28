/**
 * POST /api/subscriptions/:id/confirm — record one of the three grouped
 * document confirmations (representations, AML, risk & fees). Autosaves
 * so an investor can leave mid-signing and resume later.
 */
import { requireUser } from '@/lib/auth';
import { NotFoundError, ok, readJson, requireInt, route } from '@/lib/http';
import { confirmSection, getSubscription } from '@/lib/repositories/subscriptions';

export const POST = route(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await context.params;

    const current = await getSubscription(user.id, id);
    if (!current) throw new NotFoundError('Subscription not found');

    const body = await readJson<{ section?: unknown }>(request);
    const section = requireInt(body.section, 'section', { min: 1, max: 3 });

    return ok(await confirmSection(user.id, id, section));
  },
);
