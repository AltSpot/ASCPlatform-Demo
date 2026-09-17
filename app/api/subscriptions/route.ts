/**
 * GET  /api/subscriptions — every commitment this investor holds.
 * POST /api/subscriptions — begin one.
 *
 * Starting a subscription is gated here rather than in the UI: the
 * client-side gate is a courtesy, this is the control. Three checks, in
 * order: the 506(b) relationship gate (may the member see offerings at
 * all), the per-deal rule (the deal must have opened after the member's
 * relationship date, or it is view-only), then W-9 and KYC, then the SPV
 * admissions rules (lib/spv-rules.ts): admissions still open, a spot under
 * the investor cap, and retirement money under its limit.
 */
import { requireUser } from '@/lib/auth';
import { AdmissionError, evaluateInvestGate } from '@/lib/domain';
import { dateStr } from '@/lib/format';
import {
  ForbiddenError,
  NotFoundError,
  ok,
  readJson,
  requireInt,
  route,
  ValidationError,
} from '@/lib/http';
import { viewOnlyCopy } from '@/lib/relationship';
import { getDealAccess } from '@/lib/repositories/deals';
import { getWizardView, listProfiles } from '@/lib/repositories/investor';
import { getStanding } from '@/lib/repositories/spv';
import { decideAdmission, isRetirementProfile } from '@/lib/spv-rules';
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

  const access = await getDealAccess(body.dealId, user.id);
  if (access?.access === 'locked') {
    throw new ForbiddenError('Offerings open once your investor questionnaire is approved.');
  }
  if (!access) throw new NotFoundError('Deal not found');
  const { deal } = access;

  if (!deal.subscribable) {
    const wizard = await getWizardView(user.id);
    throw new ForbiddenError(viewOnlyCopy(wizard.relationship, dateStr));
  }

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
  let profileType: string | null = null;
  if (typeof body.profileId === 'string' && body.profileId) {
    const profiles = await listProfiles(user.id);
    const profile = profiles.find((p) => p.id === body.profileId);
    if (!profile) {
      throw new ValidationError('Unknown investment profile');
    }
    profileType = profile.type;
    profileId = body.profileId;
  }

  const standing = await getStanding(deal.id, user.id);
  if (standing) {
    const decision = decideAdmission({
      targetClose: deal.targetClose,
      status: deal.status,
      standing: standing.standing,
      alreadyMember: standing.alreadyMember,
      amount,
      retirement: isRetirementProfile(profileType),
    });
    if (!decision.ok) throw new AdmissionError(decision.code, decision.message);
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
