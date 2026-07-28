/** GET /api/deals/:id — one deal, with thesis, deck and data room. */
import { requireUser } from '@/lib/auth';
import { NotFoundError, ok, route } from '@/lib/http';
import { getDeal } from '@/lib/repositories/deals';

export const GET = route(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    await requireUser();
    const { id } = await context.params;

    const deal = await getDeal(id);
    if (!deal) throw new NotFoundError('Deal not found');

    return ok(deal);
  },
);
