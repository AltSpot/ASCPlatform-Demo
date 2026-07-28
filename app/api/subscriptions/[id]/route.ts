/**
 * GET    /api/subscriptions/:id — one commitment.
 * PATCH  /api/subscriptions/:id — edit an unsigned draft.
 * DELETE /api/subscriptions/:id — cancel, returning any reserved allocation.
 */
import { requireUser } from '@/lib/auth';
import { NotFoundError, ok, readJson, requireInt, route, ValidationError } from '@/lib/http';
import { getDeal } from '@/lib/repositories/deals';
import { listProfiles } from '@/lib/repositories/investor';
import {
  cancelSubscription,
  getSubscription,
  updateDraft,
} from '@/lib/repositories/subscriptions';

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_request: Request, context: Ctx) => {
  const user = await requireUser();
  const { id } = await context.params;

  const subscription = await getSubscription(user.id, id);
  if (!subscription) throw new NotFoundError('Subscription not found');

  return ok(subscription);
});

export const PATCH = route(async (request: Request, context: Ctx) => {
  const user = await requireUser();
  const { id } = await context.params;

  const current = await getSubscription(user.id, id);
  if (!current) throw new NotFoundError('Subscription not found');

  const body = await readJson<{ amount?: unknown; profileId?: unknown }>(request);
  const patch: { amount?: number; profileId?: string | null } = {};

  if (body.amount !== undefined) {
    const deal = await getDeal(current.dealId);
    if (!deal) throw new NotFoundError('Deal not found');
    patch.amount = requireInt(body.amount, 'amount', {
      min: deal.minInvestment,
      max: 100_000_000,
    });
  }

  if (body.profileId !== undefined) {
    if (typeof body.profileId !== 'string' || !body.profileId) {
      throw new ValidationError('"profileId" must be a profile id');
    }
    const profiles = await listProfiles(user.id);
    if (!profiles.some((p) => p.id === body.profileId)) {
      throw new ValidationError('Unknown investment profile');
    }
    patch.profileId = body.profileId;
  }

  return ok(await updateDraft(user.id, id, patch));
});

export const DELETE = route(async (_request: Request, context: Ctx) => {
  const user = await requireUser();
  const { id } = await context.params;

  const current = await getSubscription(user.id, id);
  if (!current) throw new NotFoundError('Subscription not found');

  await cancelSubscription(user.id, id);
  return ok({ ok: true });
});
