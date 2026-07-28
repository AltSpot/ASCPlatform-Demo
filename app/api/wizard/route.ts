/** GET /api/wizard — current onboarding state. */
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/http';
import { getWizardView } from '@/lib/repositories/investor';

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await getWizardView(user.id));
});
