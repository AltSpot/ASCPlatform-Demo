/**
 * POST /api/kyc/selfie — records that a live capture was taken.
 * The frame itself stays in the browser; only the fact is persisted.
 */
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/http';
import { getWizardView, recordSelfie } from '@/lib/repositories/investor';

export const POST = route(async () => {
  const user = await requireUser();
  await recordSelfie(user.id);
  return ok(await getWizardView(user.id));
});
