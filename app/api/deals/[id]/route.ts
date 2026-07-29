/** GET /api/deals/:id — one deal, with thesis, deck and data room. */
import { requireUser } from '@/lib/auth';
import { NotFoundError, ok, route } from '@/lib/http';
import { getDeal } from '@/lib/repositories/deals';

export const GET = route(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await context.params;

    // Pass the viewer so allocation reflects their own commitments only.
    const deal = await getDeal(id, user.id);
    if (!deal) throw new NotFoundError('Deal not found');

    return ok(deal);
  },
);
