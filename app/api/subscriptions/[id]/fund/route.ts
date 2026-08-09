/**
 * POST /api/subscriptions/:id/fund
 *
 * Moves a signed commitment to `funded`. The state transition stays
 * server-side because it is the books-and-records event: it is what says
 * the money arrived.
 *
 * DEMO SEAM — the ACH debit is not real and settlement is synchronous.
 *   Simulated: this call returns `funded` immediately. No payments
 *     provider is contacted, no money moves, and the funding method is
 *     whatever string the client posted.
 *   Production contract: this route initiates a transfer with the
 *     payments provider (PARTNERS.payments, Modern Treasury) against the
 *     linked bank account and returns with the subscription still in
 *     `docs_signed`. ACH settles in days, not milliseconds. The move to
 *     `funded` is driven by the provider's settlement webhook, which
 *     calls `fundSubscription` with the provider's transfer reference in
 *     place of `method`, and a failed or returned transfer leaves the
 *     10-day funding window running.
 *   Replacement: add the transfer adapter under lib/integrations/, call
 *     it here, and add a webhook route that owns the `fundSubscription`
 *     call. Nothing downstream of the state machine changes.
 */
import { requireUser } from '@/lib/auth';
import { NotFoundError, ok, readJson, requireString, route } from '@/lib/http';
import { noteSubscriptionAgreement } from '@/lib/repositories/documents';
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
    await noteSubscriptionAgreement(
      user.id,
      id,
      'Signed · funded, awaiting countersign',
    );

    return ok(funded);
  },
);
