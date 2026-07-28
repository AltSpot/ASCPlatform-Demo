/**
 * POST /api/accreditation/letter
 *
 * Records that the investor pulled the certification letter, which in
 * production opens a verification request with the accreditation partner.
 */
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/http';
import { getWizardView, recordLetterDownload } from '@/lib/repositories/investor';

export const POST = route(async () => {
  const user = await requireUser();

  await recordLetterDownload(user.id);
  await audit({
    userId: user.id,
    action: 'accreditation.letter_downloaded',
    entity: 'accreditation',
  });

  return ok(await getWizardView(user.id));
});
