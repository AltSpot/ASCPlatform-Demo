/**
 * POST /api/accreditation/verify
 *
 * The reviewer's confirmation, written server-side so the browser can
 * never set the status itself. Demo mode reaches verification through
 * the upload route, which clears on the spot; in production a
 * back-office action calls this once a reviewer has read the letter.
 */
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/http';
import { getWizardView, verifyAccreditation } from '@/lib/repositories/investor';

export const POST = route(async () => {
  const user = await requireUser();

  await verifyAccreditation(user.id);
  await audit({
    userId: user.id,
    action: 'accreditation.verified',
    entity: 'accreditation',
    metadata: { method: 'professional_letter', reviewer: 'altspot' },
  });

  return ok(await getWizardView(user.id));
});
