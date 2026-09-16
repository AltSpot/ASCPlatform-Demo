/**
 * GET /api/deals/:id — one deal, with thesis, deck and data room.
 *
 * Gated per viewer by the 506(b) relationship gate. A member who has not
 * cleared it gets the same 403 for every id, real or not, so the route
 * cannot be used to learn which offerings exist. An eligible member asking
 * for an unknown id gets a 404.
 */
import { requireUser } from '@/lib/auth';
import { ForbiddenError, NotFoundError, ok, route } from '@/lib/http';
import { getDealAccess } from '@/lib/repositories/deals';

export const GET = route(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await context.params;

    const result = await getDealAccess(id, user.id);
    if (result?.access === 'locked') {
      throw new ForbiddenError('Offerings open once your investor questionnaire is approved.');
    }
    if (!result) throw new NotFoundError('Deal not found');

    return ok(result.deal);
  },
);
