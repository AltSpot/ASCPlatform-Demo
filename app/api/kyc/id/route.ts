/**
 * POST /api/kyc/id — records that a government ID was captured.
 *
 * DEMO SEAM — no image is transmitted or examined.
 *   Simulated: the browser posts a filename and nothing else. The file is
 *     never read, never uploaded and never checked, so any file at all
 *     satisfies the step.
 *   Production contract: the image goes from the browser to the KYC
 *     vendor, which performs the document check and returns a reference.
 *     This server retains the reference, not the image. That rule is not
 *     a demo convenience: never store the document (see CLAUDE.md, "never
 *     store real PII").
 *   Replacement: the request carries the vendor's upload reference in
 *     place of a filename, and `recordIdUpload` persists that.
 */
import { requireUser } from '@/lib/auth';
import { ok, readJson, requireString, route } from '@/lib/http';
import { getWizardView, recordIdUpload } from '@/lib/repositories/investor';

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const body = await readJson<{ fileName?: unknown }>(request);
  const fileName = requireString(body.fileName, 'fileName', { maxLength: 260 });

  await recordIdUpload(user.id, fileName);
  return ok(await getWizardView(user.id));
});
