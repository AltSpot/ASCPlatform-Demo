/**
 * POST /api/accreditation/letter
 *
 * Records that the investor pulled the certification letter template.
 * Nothing is verified here; verification starts when the signed letter
 * comes back through /api/accreditation/upload.
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
