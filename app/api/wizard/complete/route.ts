/** POST /api/wizard/complete — marks setup finished. */
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/http';
import { getWizardView, markWizardComplete } from '@/lib/repositories/investor';

export const POST = route(async () => {
  const user = await requireUser();
  await markWizardComplete(user.id);
  return ok(await getWizardView(user.id));
});
