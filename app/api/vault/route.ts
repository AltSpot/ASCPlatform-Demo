/**
 * GET  /api/vault — saved W-9 information (taxpayer ID masked).
 * PUT  /api/vault — capture it once; it pre-fills every document after.
 */
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import { ok, readJson, requireString, route } from '@/lib/http';
import { getVault, saveVault } from '@/lib/repositories/investor';

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await getVault(user.id));
});

export const PUT = route(async (request: Request) => {
  const user = await requireUser();
  const body = await readJson<Record<string, unknown>>(request);

  await saveVault(user.id, {
    first: requireString(body.first, 'first', { maxLength: 100 }),
    last: requireString(body.last, 'last', { maxLength: 100 }),
    taxClass: requireString(body.taxClass, 'taxClass', { maxLength: 100 }),
    street: requireString(body.street, 'street', { maxLength: 200 }),
    city: requireString(body.city, 'city', { maxLength: 100 }),
    state: requireString(body.state, 'state', { maxLength: 60 }),
    zip: requireString(body.zip, 'zip', { maxLength: 20 }),
    tin: requireString(body.tin, 'tin', { maxLength: 40 }),
  });

  await audit({ userId: user.id, action: 'vault.saved', entity: 'vault_info' });

  return ok(await getVault(user.id));
});
