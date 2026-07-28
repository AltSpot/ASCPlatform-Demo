/**
 * GET /api/session — who is signed in, how far through setup they are,
 * and whether they may invest. Returns nulls rather than 401 so the login
 * page can call it without treating "signed out" as an error.
 */
import { getSessionUser } from '@/lib/auth';
import { evaluateInvestGate } from '@/lib/domain';
import { ok, route } from '@/lib/http';
import { getWizardView } from '@/lib/repositories/investor';

export const GET = route(async () => {
  const user = await getSessionUser();
  if (!user) return ok({ user: null, wizard: null, gate: null });

  const wizard = await getWizardView(user.id);
  return ok({ user, wizard, gate: evaluateInvestGate(wizard) });
});
