/**
 * GET  /api/subscriptions — every commitment this investor holds.
 * POST /api/subscriptions — begin one.
 *
 * Starting a subscription is gated on accreditation + W-9 + KYC, enforced
 * here rather than in the UI: the client-side gate is a courtesy, this is
 * the control.
 */
import { requireUser } from '@/lib/auth';
import { evaluateInvestGate } from '@/lib/domain';
import { NotFoundError, ok, readJson, requireInt, route, ValidationError } from '@/lib/http';
import { getDealRecord } from '@/lib/repositories/deals';
import { getWizardView, listProfiles } from '@/lib/repositories/investor';
import {
  getResumable,
  listSubscriptions,
  startSubscription,
  updateDraft,
} from '@/lib/repositories/subscriptions';

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await listSubscriptions(user.id));
});

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const body = await readJson<{
    dealId?: unknown;
    profileId?: unknown;
    amount?: unknown;
  }>(request);

  if (typeof body.dealId !== 'string' || !body.dealId) {
    throw new ValidationError('"dealId" is required');
  }

  const deal = await getDealRecord(body.dealId);
  if (!deal) throw new NotFoundError('Deal not found');

  const gate = evaluateInvestGate(await getWizardView(user.id));
  if (!gate.ok) {
    throw new ValidationError(
      `Setup incomplete: ${gate.missing.map((m) => m.label).join(', ')}`,
    );
  }

  const amount = requireInt(body.amount, 'amount', {
    min: deal.minInvestment,
    max: 100_000_000,
  });

  // The profile must belong to this investor.
  let profileId: string | null = null;
  if (typeof body.profileId === 'string' && body.profileId) {
    const profiles = await listProfiles(user.id);
    if (!profiles.some((p) => p.id === body.profileId)) {
      throw new ValidationError('Unknown investment profile');
    }
    profileId = body.profileId;
  }

  // One live draft per deal — resume rather than stacking duplicates.
  const existing = await getResumable(user.id, deal.id);
  if (existing) {
    if (existing.state === 'started') {
      return ok(await updateDraft(user.id, existing.id, { amount, profileId }));
    }
    return ok(existing);
  }

  return ok(
    await startSubscription(user.id, { dealId: deal.id, profileId, amount }),
    201,
  );
});
