/**
 * POST /api/auth/demo-login
 *
 * The "existing investor" door. Mints a fresh account under the demo
 * persona and completes every onboarding step, so the visitor lands ready
 * to invest.
 *
 * Deliberately a separate route from /api/auth/login rather than a flag
 * on it: typing an email must always produce a NEW investor with nothing
 * on file, and keeping the two paths apart means that can never drift.
 *
 * DEMO SEAM — this whole route is demo-only and refuses when DEMO_MODE is
 * off. It creates an account with no credential anybody chose and marks
 * accreditation, KYC, the Vault, a profile and a bank link as done
 * without any of them having happened. There is no production equivalent:
 * delete the route and the button that calls it.
 */
import { audit } from '@/lib/audit';
import { createSession, hashPassword } from '@/lib/auth';
import { DEMO_MODE } from '@/lib/config';
import { DEMO_PERSONA } from '@/lib/demo-persona';
import { ok, route, ValidationError } from '@/lib/http';
import { sweepStaleDemoAccounts } from '@/lib/repositories/demo';
import { createDemoPersonaInvestor } from '@/lib/repositories/investor';

export const POST = route(async () => {
  if (!DEMO_MODE) {
    throw new ValidationError('The demo investor is not available outside demo mode');
  }

  await sweepStaleDemoAccounts();

  const user = await createDemoPersonaInvestor(await hashPassword('demo-persona'));
  await createSession(user.id);

  await audit({
    userId: user.id,
    action: 'auth.login',
    entity: 'user',
    entityId: user.id,
    metadata: { persona: DEMO_PERSONA.name, preOnboarded: true },
  });

  return ok({
    user: { id: user.id, email: user.email, name: user.name },
    wizardComplete: true,
  });
});
