/**
 * POST /api/accreditation/verify
 *
 * Demo mode clears verification instantly. Production leaves the record
 * pending until the partner's webhook confirms it, which is why the
 * status is written here rather than by the client.
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
    metadata: { method: 'professional_letter', simulated: true },
  });

  return ok(await getWizardView(user.id));
});
