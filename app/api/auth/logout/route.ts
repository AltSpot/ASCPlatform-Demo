/** POST /api/auth/logout — clears the session cookie and its row. */
import { audit } from '@/lib/audit';
import { destroySession, getSessionUser } from '@/lib/auth';
import { ok, route } from '@/lib/http';

export const POST = route(async () => {
  const user = await getSessionUser();
  await destroySession();

  if (user) {
    await audit({ userId: user.id, action: 'auth.logout', entity: 'user', entityId: user.id });
  }

  return ok({ ok: true });
});
