/**
 * GET /api/deals/:id — one deal, with thesis, deck and data room.
 *
 * Those are exactly the parts a member who is not accredited does not
 * get. The repository decides; this handler never sees the withheld
 * fields, so there is nothing here to forget to strip. An unaccredited
 * caller gets a 200 with the teaser rather than a 404, because the
 * existence of the deal is not the secret.
 */
import { requireUser } from '@/lib/auth';
import { NotFoundError, ok, route } from '@/lib/http';
import { getDealForViewer } from '@/lib/repositories/deals';

export const GET = route(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await context.params;

    // Pass the viewer so allocation reflects their own commitments only.
    const deal = await getDealForViewer(id, user.id);
    if (!deal) throw new NotFoundError('Deal not found');

    return ok(deal);
  },
);
