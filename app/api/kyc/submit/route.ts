/**
 * POST /api/kyc/submit — submit for KYC / AML / OFAC screening.
 * Demo mode clears immediately; production would leave this pending.
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
