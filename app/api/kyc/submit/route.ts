/**
 * POST /api/kyc/submit — submit for KYC / AML / OFAC screening.
 *
 * DEMO SEAM — nobody is screened. Note there is no DEMO_MODE guard here:
 * this path is unconditional today, which is exactly why it is called out.
 *   Simulated: `submitKyc` writes `cleared` in the same breath as
 *     `submitted`, and this route audits 'kyc.cleared' with
 *     `simulated: true` and `actor: 'system'` a millisecond later. No
 *     identity document, watchlist, sanctions list or PEP source is
 *     consulted. Every investor passes.
 *   Production contract: the vendor adapter is handed the identity
 *     package and returns a case reference. The record stays `pending`,
 *     the wizard shows screening in progress, and clearance arrives later
 *     over a webhook, which may also come back as a manual review or a
 *     hard decline. `WizardView.kyc.complete` already treats `pending` as
 *     good enough to proceed, so a slow decision does not strand anyone.
 *   Replacement: implement the KYC adapter in lib/integrations/, have
 *     `submitKyc` stop writing the cleared fields and store the vendor
 *     case reference instead, and add a webhook route that clears the
 *     record. Only the seam moves; the wizard and the invest gate do not.
 */
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/http';
import { getWizardView, submitKyc } from '@/lib/repositories/investor';

export const POST = route(async () => {
  const user = await requireUser();

  await submitKyc(user.id);
  await audit({ userId: user.id, action: 'kyc.submitted', entity: 'kyc_record' });
  await audit({
    userId: user.id,
    action: 'kyc.cleared',
    entity: 'kyc_record',
    actor: 'system',
    metadata: { simulated: true },
  });

  return ok(await getWizardView(user.id));
});
