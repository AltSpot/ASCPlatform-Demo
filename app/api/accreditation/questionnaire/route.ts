/**
 * POST /api/accreditation/questionnaire
 *
 * The investor questionnaire: accreditation basis, investment experience
 * and financial sophistication. Validated and evaluated server-side with
 * the same definitions the screen renders (lib/relationship.ts); the
 * browser's view of which answers qualify is a courtesy, not a control.
 *
 * Approval establishes the member's 506(b) relationship date, which
 * starts the cooling-off period. A referral leaves the record under
 * review for a person to decide. A decline writes no relationship.
 *
 * Refused once a relationship exists: that date anchors which offerings
 * the member may ever subscribe to, so it cannot be moved by answering
 * again.
 */
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import { ok, readJson, route, ValidationError } from '@/lib/http';
import { parseQuestionnaire } from '@/lib/relationship';
import { getWizardView, recordQuestionnaire } from '@/lib/repositories/investor';

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const body = await readJson<Record<string, unknown>>(request);

  const current = await getWizardView(user.id);
  if (current.relationship.establishedAt) {
    throw new ValidationError('Your questionnaire is already approved.');
  }

  const parsed = parseQuestionnaire(body);
  if (!parsed.ok) throw new ValidationError(parsed.error);

  const evaluation = await recordQuestionnaire(user.id, parsed.answers);

  await audit({
    userId: user.id,
    action: 'accreditation.questionnaire_submitted',
    entity: 'accreditation',
    metadata: { basis: parsed.answers.basis },
  });
  await audit({
    userId: user.id,
    actor: 'platform',
    action:
      evaluation.outcome === 'approved'
        ? 'accreditation.approved'
        : evaluation.outcome === 'declined'
          ? 'accreditation.declined'
          : 'accreditation.referred_for_review',
    entity: 'accreditation',
    metadata: { outcome: evaluation.outcome, reason: evaluation.reason },
  });

  return ok(await getWizardView(user.id));
});
