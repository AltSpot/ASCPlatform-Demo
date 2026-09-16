/**
 * POST /api/auth/register
 *
 * Create an account from a name the member typed. Signing in with an
 * unknown address also mints an investor, but it has to guess the name
 * from the local part, and that guess ends up on every subscription
 * document they sign. This route asks instead.
 *
 * An address already in use is refused rather than signed into. See
 * registerInvestor in lib/auth.ts.
 */
import { audit } from '@/lib/audit';
import { createSession, registerInvestor } from '@/lib/auth';
import { ok, readJson, requireString, route } from '@/lib/http';
import { sweepStaleDemoAccounts } from '@/lib/repositories/demo';
import { ensureInvestorRecords, getWizardView } from '@/lib/repositories/investor';

export const POST = route(async (request: Request) => {
  const body = await readJson<{
    name?: unknown;
    email?: unknown;
    password?: unknown;
  }>(request);

  const name = requireString(body.name, 'name', { maxLength: 120 });
  const email = requireString(body.email, 'email', { maxLength: 320 });
  // Demo mode ignores the value, but the field is required so the form
  // contract does not change when real credentials are switched on.
  const password =
    typeof body.password === 'string' ? body.password : 'demo-password';

  await sweepStaleDemoAccounts();

  const user = await registerInvestor(name, email, password);
  await createSession(user.id);
  await ensureInvestorRecords(user.id);

  await audit({
    userId: user.id,
    action: 'auth.user_created',
    entity: 'user',
    entityId: user.id,
  });
  await audit({ userId: user.id, action: 'auth.login', entity: 'user', entityId: user.id });

  const wizard = await getWizardView(user.id);
  return ok({ user, wizardComplete: wizard.complete }, 201);
});
