/**
 * GET  /api/bank — the linked funding source, if any.
 * POST /api/bank — link one.
 *
 * Demo mode fabricates the account mask. Production exchanges a Plaid
 * public token here; credentials never touch this server either way.
 */
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import { ok, readJson, requireString, route } from '@/lib/http';
import { getBank, linkBank } from '@/lib/repositories/investor';

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await getBank(user.id));
});

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const body = await readJson<{ institution?: unknown }>(request);
  const institution = requireString(body.institution, 'institution', {
    maxLength: 120,
  });

  const bank = await linkBank(user.id, institution);
  await audit({
    userId: user.id,
    action: 'bank.linked',
    entity: 'bank_account',
    entityId: bank.id,
    metadata: { institution, simulated: true },
  });

  return ok(bank, 201);
});
