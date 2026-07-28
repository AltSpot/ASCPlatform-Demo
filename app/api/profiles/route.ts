/**
 * GET  /api/profiles — investment profiles (Personal / Entity / IRA).
 * POST /api/profiles — create one.
 */
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import { ok, readJson, requireString, route } from '@/lib/http';
import { createProfile, getVault, listProfiles } from '@/lib/repositories/investor';

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await listProfiles(user.id));
});

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const body = await readJson<{ type?: unknown; name?: unknown }>(request);

  const type = requireString(body.type, 'type', { maxLength: 60 });
  const name = requireString(body.name, 'name', { maxLength: 160 });

  // Inherit the tax classification already captured in the Vault.
  const vault = await getVault(user.id);
  const profile = await createProfile(user.id, {
    type,
    name,
    taxClass: vault.taxClass,
  });

  await audit({
    userId: user.id,
    action: 'profile.created',
    entity: 'investment_profile',
    entityId: profile.id,
    metadata: { type },
  });

  return ok(profile, 201);
});
