/**
 * POST /api/auth/login
 *
 * Demo mode accepts any email + password and mints the investor on first
 * sight. See lib/auth.ts — this route contains no demo logic of its own.
 */
import { authenticate, createSession } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { ok, readJson, requireString, route } from '@/lib/http';
import { sweepStaleDemoAccounts } from '@/lib/repositories/demo';
import { ensureInvestorRecords, getWizardView } from '@/lib/repositories/investor';

export const POST = route(async (request: Request) => {
  const body = await readJson<{ email?: unknown; password?: unknown }>(request);

  const email = requireString(body.email, 'email', { maxLength: 320 });
  // Demo mode ignores the value, but the field is still required so the
  // form contract does not change when real credentials are switched on.
  const password =
    typeof body.password === 'string' ? body.password : 'demo-password';

  // Opportunistic housekeeping: clear out previous visitors before this
  // one starts. A container host has no cron, and login is the one moment
  // a small delay costs nothing.
  await sweepStaleDemoAccounts();

  const { user, created } = await authenticate(email, password);
  await createSession(user.id);
  await ensureInvestorRecords(user.id);

  if (created) {
    await audit({ userId: user.id, action: 'auth.user_created', entity: 'user', entityId: user.id });
  }
  await audit({ userId: user.id, action: 'auth.login', entity: 'user', entityId: user.id });

  const wizard = await getWizardView(user.id);

  return ok({ user, wizardComplete: wizard.complete });
});
