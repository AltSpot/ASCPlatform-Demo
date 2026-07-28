/**
 * POST /api/accreditation/upload
 *
 * The investor returns the completed certification letter. The file is
 * never uploaded to this server: the browser sends the filename, we keep
 * that in the audit trail and put the record in front of a reviewer.
 *
 * Real handling is an automated read of the letter followed by an AltSpot
 * reviewer confirming it. Demo mode collapses both into one call so the
 * flow can be walked end to end.
 */
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import { DEMO_MODE } from '@/lib/config';
import { ok, readJson, requireString, route } from '@/lib/http';
import {
  getWizardView,
  recordLetterUpload,
  verifyAccreditation,
} from '@/lib/repositories/investor';

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const body = await readJson<{ fileName?: unknown }>(request);
  const fileName = requireString(body.fileName, 'fileName', { maxLength: 260 });

  await recordLetterUpload(user.id);

  // DEMO SEAM — production leaves the record pending until the reviewer
  // confirms through /api/accreditation/verify, and audits the upload
  // under an 'accreditation.letter_uploaded' action that lib/audit.ts
  // will need to declare.
  if (DEMO_MODE) {
    await verifyAccreditation(user.id);

    await audit({
      userId: user.id,
      action: 'accreditation.verified',
      entity: 'accreditation',
      metadata: {
        method: 'professional_letter',
        fileName,
        stored: false,
        simulated: true,
      },
    });
  }

  return ok(await getWizardView(user.id));
});
