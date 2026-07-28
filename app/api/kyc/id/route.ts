/**
 * POST /api/kyc/id — records that a government ID was captured.
 *
 * Only the filename is kept. The image itself never leaves the browser in
 * demo mode; production would stream it straight to the KYC vendor and
 * retain nothing locally.
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
