/**
 * POST /api/deals/:id/waitlist — wait for a spot in a full SPV.
 *
 * Work order screen 13. Only when the SPV has reached its investor cap,
 * only for a deal this member could otherwise subscribe to, and only while
 * admissions are open. Joining reserves nothing and moves no money.
 */
import { requireUser } from '@/lib/auth';
import { AdmissionError } from '@/lib/domain';
import { dateStr } from '@/lib/format';
import { ForbiddenError, NotFoundError, ok, readJson, route, ValidationError } from '@/lib/http';
import { viewOnlyCopy } from '@/lib/relationship';
import { getDealAccess } from '@/lib/repositories/deals';
import { getWizardView } from '@/lib/repositories/investor';
import { getStanding, joinWaitlist } from '@/lib/repositories/spv';
import { admissionsOpen, isFull } from '@/lib/spv-rules';

export const POST = route(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await context.params;

    const access = await getDealAccess(id, user.id);
    if (access?.access === 'locked') {
      throw new ForbiddenError('Offerings open once your investor questionnaire is approved.');
    }
    if (!access) throw new NotFoundError('Deal not found');
    const { deal } = access;

    if (!deal.subscribable) {
      throw new ForbiddenError(viewOnlyCopy((await getWizardView(user.id)).relationship, dateStr));
    }
    if (!admissionsOpen(deal.targetClose, deal.status)) {
      throw new AdmissionError('admissions_closed', 'Admissions for this SPV have closed.');
    }

    const standing = await getStanding(deal.id, user.id);
    if (!standing || !isFull(standing.standing) || standing.alreadyMember) {
      throw new ValidationError('This SPV has room. Subscribe instead of joining the waitlist.');
    }

    const body = await readJson<{ amount?: unknown }>(request);
    const amount =
      typeof body.amount === 'number' && Number.isInteger(body.amount) && body.amount > 0
        ? body.amount
        : null;

    return ok(await joinWaitlist(user.id, deal.id, amount), 201);
  },
);
