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
 */
import { audit } from '@/lib/audit';
import { createSession, hashPassword } from '@/lib/auth';
import { DEMO_MODE } from '@/lib/config';
import { prisma } from '@/lib/db';
import { DEMO_PERSONA, personaEmail } from '@/lib/demo-persona';
import { ok, route, ValidationError } from '@/lib/http';
import { sweepStaleDemoAccounts } from '@/lib/repositories/demo';
import { provisionDemoPersona } from '@/lib/repositories/investor';

export const POST = route(async () => {
  if (!DEMO_MODE) {
    throw new ValidationError('The demo investor is not available outside demo mode');
  }

  await sweepStaleDemoAccounts();

  // A distinct address per visitor, so two people using the button at the
  // same time never share a profile or see each other's commitments.
  const user = await prisma.user.create({
    data: {
      email: personaEmail(),
      name: DEMO_PERSONA.name,
      passwordHash: await hashPassword('demo-persona'),
    },
  });

  await provisionDemoPersona(user.id);
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
